import * as esbuild from 'esbuild'
import * as fs from 'fs/promises'
import * as crypto from 'crypto'
import * as path from "path";
//import { createRequire } from "module";

//import {exec} from 'pkg'

import replacePlugin from 'esbuild-plugin-text-replace'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import aliasPlugin from 'esbuild-plugin-alias'
import nullPackage from './esbuild-plugin-null-package'


// const __dirname = dirname(fileURLToPath(import.meta.url));
// const require = createRequire(import.meta.url);


const createHash = (text) => crypto.createHash("sha256")
    .update(text)
    .digest("hex");

interface nodeI {
    file: string,
    types: string[],

}

interface configNodesT {
    nodes: nodeI[]
}

interface flowNodesT {
    type: string
}

export async function main(inputOptions) {
    let options = { ...inputOptions };

    const BUNDLE_ONLY_REQIRED_NODES = true

    const SRCDIR = path.join(__dirname, "../src")
    const WRAPPER = path.join(__dirname, "type_wrapper", options.type + '.mjs')

    const DISTDIR = (options.output === 'build' ? path.join(__dirname, "build") : path.resolve(options.output))
    const APPDIR = path.join(DISTDIR, 'app')
    const USERDIR = path.join(DISTDIR, 'userDir')


    await fs.mkdir(path.join(USERDIR, 'node_modules'), { recursive: true })
    await fs.mkdir(path.join(USERDIR, 'lib', 'flows'), { recursive: true })
    // to fix not including empty folders in ZIP
    const gitignore = `
*.*
!.gitignore
`
    await fs.writeFile(path.join(USERDIR, 'node_modules','.gitignore'), gitignore)
    await fs.writeFile(path.join(USERDIR, 'lib','flows','.gitignore'), gitignore)

    const packageData=JSON.stringify({
        "name": "node-red-project",
        "description": "A Node-RED Project",
        "version": "0.0.1",
        "private": true
    })
    
    await fs.writeFile(path.join(USERDIR, 'package.json'), packageData)
    

    const flowData: flowNodesT[] = JSON.parse(await fs.readFile(path.resolve(options.flowFile), { encoding: 'utf8' }))
    const configNodesRaw = await fs.readFile(path.resolve(options.nodesFile), { encoding: 'utf8' })
    const configNodes: configNodesT[] = JSON.parse(configNodesRaw)
    const requiredTypes = [...new Set(flowData.map(node => node.type).filter(node => node !== "tab"))]

    console.log('bundled Triggers/Nodes:', requiredTypes)

    let requiredNodes = {}
    let nodesFiles = []
    let origNodeFiles = []
    let reqiredNodeFiles = []




    Object.entries(configNodes).forEach(([prop, value]) => {
        const packageNodes = {}
        let needed = false;
        Object.entries(value.nodes).forEach(([prop, value]) => {
            origNodeFiles.push(value.file)
            if (requiredTypes.filter(x => value.types.includes(x)).length > 0) {
                reqiredNodeFiles.push(value.file)
                const filename = value.file.replace(/.*\/node_modules\/(.*)/, "$1")
                nodesFiles.push(filename)
                packageNodes[prop] = value
                //packageNodes[prop].file = `./node_modules/nodes/m${createHash(filename)}.js`
                needed = true
            }
        })
        if (needed) {
            requiredNodes[prop] = value
            requiredNodes[prop].nodes = packageNodes
        }
    })

    let origNodeLoader = 'let r = {' + (BUNDLE_ONLY_REQIRED_NODES ? reqiredNodeFiles : origNodeFiles).map((file) => `\n'${file}': ()=>require('${file.replace(/.*\/node_modules\/(.*)/, "$1")}')`).join(",") + '}[node.file]()'


    //await fs.writeFile(path.join(TMP, 'required-nodes.js'), origNodeLoader)
    await fs.writeFile(`${USERDIR}/.config.nodes.json`, JSON.stringify(requiredNodes))
    await fs.writeFile(`${USERDIR}/flow.json`, JSON.stringify(flowData))
    await fs.writeFile(`${USERDIR}/credential.json`, '{"$":"04c4fb321d628b993a794499ab059542t4w="}')
    await fs.writeFile(`${USERDIR}/settings.js`, JSON.stringify(
        {
            "editorTheme": {
                projects: {
                    enabled: false
                }
            }
        }
    ))



    await esbuild.build(
        {
            entryPoints: [WRAPPER],
            bundle: true,
            minify: options.minify,
            sourcemap: options.sourcemap,
            platform: "node",
            target: "node14",
            outfile: path.join(DISTDIR, 'index.js'),
            //external: ['@node-red/nodes'],
            plugins: [
                // aliasPlugin({
                //     // remove not needed modules
                //     '@node-red/editor-api': path.join(__dirname, "null-module", "index.js"),
                //     '@node-red/editor-client': path.join(__dirname, "null-module", "index.js"),
                //     'node-red-admin': path.join(__dirname, "null-module", "index.js"),
                //     'oauth2orize': path.join(__dirname, "null-module", "index.js"),

                // }),
                nullPackage([ // remove not needed modules by returning empty modules
                    '@node-red/editor-api',
                    '@node-red/editor-client',
                    'node-red-admin',
                    'oauth2orize',
                ]),
                replacePlugin(
                    {
                        include: /@node-red\/registry\/lib\/loader\.js$/,
                        pattern: [
                            // direcly load required nodes
                            // node_modules/@node-red/registry/lib/loader.js:42
                            [/var modules = localfilesystem\.getNodeFiles\(disableNodePathScan\);\s*return loadModuleFiles\(modules\)/g, `return loadModuleFiles(${BUNDLE_ONLY_REQIRED_NODES ? JSON.stringify(requiredNodes) : configNodesRaw})`],
                            // replace dynamic load with static table which allows esbuild to inline the code
                            // node_modules/@node-red/registry/lib/loader.js:361
                            ['var r = require(node.file);', origNodeLoader],
                            // remove check which will check if node exists in filesystem when node module name != "node-red"
                            // node_modules/@node-red/registry/lib/loader.js:54
                            ['module.name != "node-red" && first', 'false'],
                        ]
                    },

                ),
                replacePlugin(
                    {
                        include: /@node-red\/runtime\/lib\/index\.js$/,
                        pattern: [
                            // do not fail if there is no package in parent folder
                            // node_modules/@node-red/runtime/lib/index.js:103
                            ['version = require(path.join(__dirname,"..","package.json")).version;',
                                'try { version = require(path.join(__dirname,"..","package.json")).version; } catch(err){version="1.0.0"}'],
                            // temp fixes - has been merged upstream in node-red repository
                            ['const installRetry', 'let installRetry']
                        ],
                    }
                ),
                replacePlugin(
                    {
                        include: /node-red\/lib\/red\.js$/,
                        pattern: [
                            // direcly load required nodes
                            // node_modules/@node-red/registry/lib/loader.js:42
                            ['userSettings.coreNodesDir = path.dirname(require.resolve("@node-red/nodes"))', `userSettings.coreNodesDir = '${USERDIR}'`],
                        ]
                    },

                ),
            ],
        }
    )

    // try {
    //     const { exec } = require('pkg')
    //     await exec([path.join(DISTDIR, 'package.json'), '--targets', 'node14-macos-x64', '--output', 'node-red-app', '--compress', 'Brotli'])
    // } catch (err) {

    //}
}

