declare module 'postcss-plugin-namespace' {
    interface PostcssNamespaceOptions {
      namespace: string;
    }
  
    const postcssPluginNamespace: (options: PostcssNamespaceOptions) => any;
  
    export = postcssPluginNamespace;
}