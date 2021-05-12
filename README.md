# Node-RED Bundler 

Bundle Node-RED and all required Nodes into one minified javascript file.

Typical use cases:
* AWS Lambda (Serverless Functions)
* Command line apps

The destination folder will contain all required files including the flows to start the Node-RED App on any system with node but without the Node-RED source code. You can change the flow, but any change which requires a new Node will require a rebuild of the base file `build/index.js`.

The final size depends mainly on the included Nodes and a starts with 1.5Mb compressed code for the base file. Alle code for Administraion and the editor have been removed and are not avialiable in the final Application!

The scope of the project is only to provide runtimes to execute flows. For managing and editing of flows use existing solutions.

## Install

Install this package into your node environment to allow direct access to your installed nodes.

    $ npm install --save-dev node-red-contrib-bundler

## Usage

    $ npm run node-red-bundler build path/to/flows.js path/to/ -o ./build


**run the create Node-RED App:**

    $ cd ./build; node index.js

## Options

    $ npm run node-red-bundler build --help

```
node-red-bundler build [flowFile] [nodesFile]

bundle Node-RED to single file with required Nodes

Positionals:
  flowFile   path to flow.js file                           [default: "flow.js"]
  nodesFile  path to .config.nodes.json file     [default: ".config.nodes.json"]

Options:
      --version    Show version number                                 [boolean]
      --help       Show help                                           [boolean]
  -o, --output     Directory for the final bundle
                                          [string] [required] [default: "build"]
  -t, --type       Specify the type of wrapper for Node-RED
      [string] [required] [choices: "aws_lambda", "cmd"] [default: "aws_lambda"]
      --minify     minify the javascript bundle        [boolean] [default: true]
      --sourcemap  create sourcemap for the javascript bundle
                                                       [boolean] [default: true]

```

**Notes:** 
 * Only `--type aws_lambda` is supported - see Roadmap
 * Created Javascript code is optimized for node >=14.0.0

## Wrapper Types

### AWS Lambda

This wrapper allows to upload a flow to AWS Lambda. The flow needs the [node-red-contrib-lambda-io](https://flows.nodered.org/node/node-red-contrib-lambda-io) Nodes to get triggered by AWS Events and to return a Output to finish the Lambda Request.

**Simple Example Flow:**
`[lambda in]` -> `[function]` -> `[debug]` ->`[lambda out]`

`flow.json`
```json
[
    {
        "id": "523972b2.04908c",
        "type": "tab",
        "label": "Flow 1",
        "disabled": false,
        "info": ""
    },
    {
        "id": "92a73334.57bf48",
        "type": "lambda in",
        "z": "523972b2.04908c",
        "name": "",
        "x": 90,
        "y": 120,
        "wires": [
            [
                "b4871dda.ccf24"
            ]
        ]
    },
    
    {
        "id": "b4871dda.ccf24",
        "type": "function",
        "z": "523972b2.04908c",
        "name": "",
        "func": "\n\nreturn {payload: msg.payload.resource, test:2};",
        "outputs": 1,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 290,
        "y": 120,
        "wires": [
            [
                "78ce54d8.6bd434",
                "26ed8d3d.b32b9a"
            ]
        ]
    },
    {
        "id": "26ed8d3d.b32b9a",
        "type": "debug",
        "z": "523972b2.04908c",
        "name": "XX1",
        "active": true,
        "tosidebar": true,
        "console": true,
        "tostatus": true,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "payload",
        "statusType": "auto",
        "x": 470,
        "y": 200,
        "wires": []
    },
    {
        "id": "78ce54d8.6bd434",
        "type": "lambda out",
        "z": "523972b2.04908c",
        "name": "",
        "lambda_proxy_helper": false,
        "x": 480,
        "y": 120,
        "wires": []
    }
]
```

**Deployment to AWS:**

* Zip the created output of the bundler
* create or update a AWS Lambda function

**Environment Configurations:**

`NODE_RED_USERDIR` : relative path to [`userDir`](https://nodered.org/docs/user-guide/runtime/configuration) directory inside the zip (Default: `"./userDir/"`)
`NODE_RED_LOG_LEVEL` : Node-RED [logging](https://nodered.org/docs/user-guide/runtime/logging) levels (Default: `error`)


## Roadmap

 - [ ] Node RED projects support
 - [ ] Fix code in Node RED @node-red/loader package
 - [ ] Options to customize Wrapper and Javascript target optimizations (e.g. Node 16.x)
 - [ ] Command Line Wrapper
 - [ ] Export binary for MacOS, Linux, Windows
 - [ ] tests
 - [ ] speed tests

## Contribution

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
1. Create your Feature Branch (git checkout -b feature/AmazingFeature)
1. Commit your Changes (git commit -m 'Add some AmazingFeature')
1. Push to the Branch (git push origin feature/AmazingFeature)
1. Open a Pull Request

## Built With

- [Node-RED](https://nodered.org)
- [esbuild](https://esbuild.github.io)

## License

Distributed under the "bsd-2-clause" License. See [LICENSE.txt](LICENSE.txt) for more information.
