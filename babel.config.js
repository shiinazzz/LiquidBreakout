module.exports = function (api) {
    api.cache(false);
    return {
      presets: [
        [
          "@babel/preset-env",
            {
              targets: { node: '16.11' },
              shippedProposals: true,
              modules: 'commonjs'
            }
        ], 
        "@babel/preset-typescript"
      ]
    };
  }