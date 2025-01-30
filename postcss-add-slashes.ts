export default function addSlashesPlugin(opts = {}) {
    return {
      postcssPlugin: 'postcss-add-slashes',
      Once(root: any) {
        // Traverse through each rule in the CSS
        root.walkRules((rule: any) => {
          // Replace colons in class names with slashes
          // rule.selector = rule.selector.replace(/(\S+):/g, '$1\\/'); // Add slashes before colons
        });
      }
    };
}
  
addSlashesPlugin.postcss = true;
  