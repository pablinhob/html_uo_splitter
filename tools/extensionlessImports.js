import { registerHooks } from 'node:module';

/**
 * Permite ejecutar con Node los scripts de tools/ que importan código de src/, donde
 * los imports propios van sin extensión (CLAUDE.md 9.10) como resuelve Vite.
 * Uso: node --import ./tools/extensionlessImports.js <script>
 */

const extensions = ['.js', '.jsx'];
const isRelative = (specifier) => specifier.startsWith('./') || specifier.startsWith('../');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!isRelative(specifier) || /\.[a-z]+$/i.test(specifier)) {
      return nextResolve(specifier, context);
    }
    const resolved = extensions.reduce((found, extension) => {
      if (found) return found;
      try {
        return nextResolve(`${specifier}${extension}`, context);
      } catch (error) {
        if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
        return null;
      }
    }, null);
    return resolved ?? nextResolve(specifier, context);
  },
});
