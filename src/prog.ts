import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const toArray = val => (Array.isArray(val) ? val : val == null ? [] : [val]);

export default handler => {

	const cmd = opts  => {



		handler(opts);
	};



	// Parse argv; add extra aliases
	return argv =>
		yargs(hideBin(argv))
			.scriptName('node-red-bundler')
			.command('build [flowFile] [nodesFile]', 'bundle Node-RED to single file with required Nodes', (yargs) => {
				return yargs
					.positional('flowFile', {
						describe: 'path to flow.js file',
						default: 'flow.js'
					})
					.positional('nodesFile', {
						describe: 'path to .config.nodes.json file',
						default: '.config.nodes.json'
					})
					.option('o', {
						alias: 'output',
						demandOption: true,
						default: 'build',
						describe: 'Directory for the final bundle',
						type: 'string'
					})
					.option('t', {
						alias: 'type',
						demandOption: true,
						default: 'aws_lambda',
						choices: ['aws_lambda', 'cmd'],
						describe: 'Specify the type of wrapper for Node-RED',
						type: 'string'
					})
					.option('minify', {
						type: 'boolean',
						description: 'minify the javascript bundle',
						default: true
					})
					.option('sourcemap', {
						type: 'boolean',
						description: 'create sourcemap for the javascript bundle',
						default: true
					})
			},cmd)
			.help()
			.argv
};