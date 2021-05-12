
export default function nullPackage(options = []) {
    if (!Array.isArray(options) || options.length === 0) {
        throw new Error('Expect options to be a non empty array!')
    }
    const modulPaths = options;
    const re = new RegExp(`^${modulPaths.map(x => escapeRegExp(x)).join('|')}$`);
    return {
        name: 'null-package',
        setup(build) {
            build.onResolve({ filter: re }, args => ({
                path: args.path,
                namespace: 'null-package'
            }));
            build.onLoad({ filter: /.*/, namespace: 'null-package' }, async (args) => ({
                contents:`module.exports = {}`
            }))
        }
    }
}

function escapeRegExp(string) {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}