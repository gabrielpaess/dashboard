var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// plugins/visual-editor/vite-plugin-react-inline-editor.js
var vite_plugin_react_inline_editor_exports = {};
__export(vite_plugin_react_inline_editor_exports, {
  default: () => inlineEditPlugin
});
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/node_modules/@babel/parser/lib/index.js";
import traverseBabel from "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/node_modules/@babel/traverse/lib/index.js";
import generate from "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/node_modules/@babel/generator/lib/index.js";
import * as t from "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/node_modules/@babel/types/lib/index.js";
import fs from "fs";
function parseEditId(editId) {
  const parts = editId.split(":");
  if (parts.length < 3) {
    return null;
  }
  const column = parseInt(parts.at(-1), 10);
  const line = parseInt(parts.at(-2), 10);
  const filePath = parts.slice(0, -2).join(":");
  if (!filePath || isNaN(line) || isNaN(column)) {
    return null;
  }
  return { filePath, line, column };
}
function checkTagNameEditable(openingElementNode, editableTagsList) {
  if (!openingElementNode || !openingElementNode.name)
    return false;
  const nameNode = openingElementNode.name;
  if (nameNode.type === "JSXIdentifier" && editableTagsList.includes(nameNode.name)) {
    return true;
  }
  if (nameNode.type === "JSXMemberExpression" && nameNode.property && nameNode.property.type === "JSXIdentifier" && editableTagsList.includes(nameNode.property.name)) {
    return true;
  }
  return false;
}
function validateImageSrc(openingNode) {
  if (!openingNode || !openingNode.name || openingNode.name.name !== "img") {
    return { isValid: true, reason: null };
  }
  const hasPropsSpread = openingNode.attributes.some(
    (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
  );
  if (hasPropsSpread) {
    return { isValid: false, reason: "props-spread" };
  }
  const srcAttr = openingNode.attributes.find(
    (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
  );
  if (!srcAttr) {
    return { isValid: false, reason: "missing-src" };
  }
  if (!t.isStringLiteral(srcAttr.value)) {
    return { isValid: false, reason: "dynamic-src" };
  }
  if (!srcAttr.value.value || srcAttr.value.value.trim() === "") {
    return { isValid: false, reason: "empty-src" };
  }
  return { isValid: true, reason: null };
}
function inlineEditPlugin() {
  return {
    name: "vite-inline-edit-plugin",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(jsx|tsx)$/.test(id) || !id.startsWith(VITE_PROJECT_ROOT) || id.includes("node_modules")) {
        return null;
      }
      const relativeFilePath = path.relative(VITE_PROJECT_ROOT, id);
      const webRelativeFilePath = relativeFilePath.split(path.sep).join("/");
      try {
        const babelAst = parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
          errorRecovery: true
        });
        let attributesAdded = 0;
        traverseBabel.default(babelAst, {
          enter(path3) {
            if (path3.isJSXOpeningElement()) {
              const openingNode = path3.node;
              const elementNode = path3.parentPath.node;
              if (!openingNode.loc) {
                return;
              }
              const alreadyHasId = openingNode.attributes.some(
                (attr) => t.isJSXAttribute(attr) && attr.name.name === "data-edit-id"
              );
              if (alreadyHasId) {
                return;
              }
              const isCurrentElementEditable = checkTagNameEditable(openingNode, EDITABLE_HTML_TAGS);
              if (!isCurrentElementEditable) {
                return;
              }
              const imageValidation = validateImageSrc(openingNode);
              if (!imageValidation.isValid) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              let shouldBeDisabledDueToChildren = false;
              if (t.isJSXElement(elementNode) && elementNode.children) {
                const hasPropsSpread = openingNode.attributes.some(
                  (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
                );
                const hasDynamicChild = elementNode.children.some(
                  (child) => t.isJSXExpressionContainer(child)
                );
                if (hasDynamicChild || hasPropsSpread) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (!shouldBeDisabledDueToChildren && t.isJSXElement(elementNode) && elementNode.children) {
                const hasEditableJsxChild = elementNode.children.some((child) => {
                  if (t.isJSXElement(child)) {
                    return checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS);
                  }
                  return false;
                });
                if (hasEditableJsxChild) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (shouldBeDisabledDueToChildren) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              if (t.isJSXElement(elementNode) && elementNode.children && elementNode.children.length > 0) {
                let hasNonEditableJsxChild = false;
                for (const child of elementNode.children) {
                  if (t.isJSXElement(child)) {
                    if (!checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS)) {
                      hasNonEditableJsxChild = true;
                      break;
                    }
                  }
                }
                if (hasNonEditableJsxChild) {
                  const disabledAttribute = t.jsxAttribute(
                    t.jsxIdentifier("data-edit-disabled"),
                    t.stringLiteral("true")
                  );
                  openingNode.attributes.push(disabledAttribute);
                  attributesAdded++;
                  return;
                }
              }
              let currentAncestorCandidatePath = path3.parentPath.parentPath;
              while (currentAncestorCandidatePath) {
                const ancestorJsxElementPath = currentAncestorCandidatePath.isJSXElement() ? currentAncestorCandidatePath : currentAncestorCandidatePath.findParent((p) => p.isJSXElement());
                if (!ancestorJsxElementPath) {
                  break;
                }
                if (checkTagNameEditable(ancestorJsxElementPath.node.openingElement, EDITABLE_HTML_TAGS)) {
                  return;
                }
                currentAncestorCandidatePath = ancestorJsxElementPath.parentPath;
              }
              const line = openingNode.loc.start.line;
              const column = openingNode.loc.start.column + 1;
              const editId = `${webRelativeFilePath}:${line}:${column}`;
              const idAttribute = t.jsxAttribute(
                t.jsxIdentifier("data-edit-id"),
                t.stringLiteral(editId)
              );
              openingNode.attributes.push(idAttribute);
              attributesAdded++;
            }
          }
        });
        if (attributesAdded > 0) {
          const generateFunction = generate.default || generate;
          const output = generateFunction(babelAst, {
            sourceMaps: true,
            sourceFileName: webRelativeFilePath
          }, code);
          return { code: output.code, map: output.map };
        }
        return null;
      } catch (error) {
        console.error(`[vite][visual-editor] Error transforming ${id}:`, error);
        return null;
      }
    },
    // Updates source code based on the changes received from the client
    configureServer(server) {
      server.middlewares.use("/api/apply-edit", async (req, res, next) => {
        if (req.method !== "POST")
          return next();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          var _a;
          let absoluteFilePath = "";
          try {
            const { editId, newFullText } = JSON.parse(body);
            if (!editId || typeof newFullText === "undefined") {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Missing editId or newFullText" }));
            }
            const parsedId = parseEditId(editId);
            if (!parsedId) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid editId format (filePath:line:column)" }));
            }
            const { filePath, line, column } = parsedId;
            absoluteFilePath = path.resolve(VITE_PROJECT_ROOT, filePath);
            if (filePath.includes("..") || !absoluteFilePath.startsWith(VITE_PROJECT_ROOT) || absoluteFilePath.includes("node_modules")) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid path" }));
            }
            const originalContent = fs.readFileSync(absoluteFilePath, "utf-8");
            const babelAst = parse(originalContent, {
              sourceType: "module",
              plugins: ["jsx", "typescript"],
              errorRecovery: true
            });
            let targetNodePath = null;
            const visitor = {
              JSXOpeningElement(path3) {
                const node = path3.node;
                if (node.loc && node.loc.start.line === line && node.loc.start.column + 1 === column) {
                  targetNodePath = path3;
                  path3.stop();
                }
              }
            };
            traverseBabel.default(babelAst, visitor);
            if (!targetNodePath) {
              res.writeHead(404, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Target node not found by line/column", editId }));
            }
            const generateFunction = generate.default || generate;
            const targetOpeningElement = targetNodePath.node;
            const parentElementNode = (_a = targetNodePath.parentPath) == null ? void 0 : _a.node;
            const isImageElement = targetOpeningElement.name && targetOpeningElement.name.name === "img";
            let beforeCode = "";
            let afterCode = "";
            let modified = false;
            if (isImageElement) {
              const beforeOutput = generateFunction(targetOpeningElement, {});
              beforeCode = beforeOutput.code;
              const srcAttr = targetOpeningElement.attributes.find(
                (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
              );
              if (srcAttr && t.isStringLiteral(srcAttr.value)) {
                srcAttr.value = t.stringLiteral(newFullText);
                modified = true;
                const afterOutput = generateFunction(targetOpeningElement, {});
                afterCode = afterOutput.code;
              }
            } else {
              if (parentElementNode && t.isJSXElement(parentElementNode)) {
                const beforeOutput = generateFunction(parentElementNode, {});
                beforeCode = beforeOutput.code;
                parentElementNode.children = [];
                if (newFullText && newFullText.trim() !== "") {
                  const newTextNode = t.jsxText(newFullText);
                  parentElementNode.children.push(newTextNode);
                }
                modified = true;
                const afterOutput = generateFunction(parentElementNode, {});
                afterCode = afterOutput.code;
              }
            }
            if (!modified) {
              res.writeHead(409, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Could not apply changes to AST." }));
            }
            const output = generateFunction(babelAst, {});
            const newContent = output.code;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              success: true,
              newFileContent: newContent,
              beforeCode,
              afterCode
            }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error during edit application." }));
          }
        });
      });
    }
  };
}
var __vite_injected_original_import_meta_url, __filename, __dirname2, VITE_PROJECT_ROOT, EDITABLE_HTML_TAGS;
var init_vite_plugin_react_inline_editor = __esm({
  "plugins/visual-editor/vite-plugin-react-inline-editor.js"() {
    __vite_injected_original_import_meta_url = "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/plugins/visual-editor/vite-plugin-react-inline-editor.js";
    __filename = fileURLToPath(__vite_injected_original_import_meta_url);
    __dirname2 = path.dirname(__filename);
    VITE_PROJECT_ROOT = path.resolve(__dirname2, "../..");
    EDITABLE_HTML_TAGS = ["a", "Button", "button", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "Label", "img"];
  }
});

// plugins/visual-editor/visual-editor-config.js
var EDIT_MODE_STYLES;
var init_visual_editor_config = __esm({
  "plugins/visual-editor/visual-editor-config.js"() {
    EDIT_MODE_STYLES = `
  #root[data-edit-mode-enabled="true"] [data-edit-id] {
    cursor: pointer; 
    outline: 1px dashed #357DF9; 
    outline-offset: 2px;
    min-height: 1em;
  }
  #root[data-edit-mode-enabled="true"] {
    cursor: pointer;
  }
  #root[data-edit-mode-enabled="true"] [data-edit-id]:hover {
    background-color: #357DF933;
    outline-color: #357DF9; 
  }

  @keyframes fadeInTooltip {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  #inline-editor-disabled-tooltip {
    display: none; 
    opacity: 0; 
    position: absolute;
    background-color: #1D1E20;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    z-index: 10001;
    font-size: 14px;
    border: 1px solid #3B3D4A;
    max-width: 184px;
    text-align: center;
  }

  #inline-editor-disabled-tooltip.tooltip-active {
    display: block;
    animation: fadeInTooltip 0.2s ease-out forwards;
  }
`;
  }
});

// plugins/visual-editor/vite-plugin-edit-mode.js
var vite_plugin_edit_mode_exports = {};
__export(vite_plugin_edit_mode_exports, {
  default: () => inlineEditDevPlugin
});
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
function inlineEditDevPlugin() {
  return {
    name: "vite:inline-edit-dev",
    apply: "serve",
    transformIndexHtml() {
      const scriptPath = resolve(__dirname3, "edit-mode-script.js");
      const scriptContent = readFileSync(scriptPath, "utf-8");
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: scriptContent,
          injectTo: "body"
        },
        {
          tag: "style",
          children: EDIT_MODE_STYLES,
          injectTo: "head"
        }
      ];
    }
  };
}
var __vite_injected_original_import_meta_url2, __filename2, __dirname3;
var init_vite_plugin_edit_mode = __esm({
  "plugins/visual-editor/vite-plugin-edit-mode.js"() {
    init_visual_editor_config();
    __vite_injected_original_import_meta_url2 = "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/plugins/visual-editor/vite-plugin-edit-mode.js";
    __filename2 = fileURLToPath2(__vite_injected_original_import_meta_url2);
    __dirname3 = resolve(__filename2, "..");
  }
});

// vite.config.js
import path2 from "node:path";
import react from "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/node_modules/@vitejs/plugin-react/dist/index.js";
import { createLogger, defineConfig, loadEnv } from "file:///C:/Users/gabri/Desktop/Trend%20Quadros/dashboard/trend-quadros-dashboard/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\gabri\\Desktop\\Trend Quadros\\dashboard\\trend-quadros-dashboard";
var isDev = process.env.NODE_ENV !== "production";
var inlineEditPlugin2;
var editModeDevPlugin;
if (isDev) {
  try {
    inlineEditPlugin2 = (await Promise.resolve().then(() => (init_vite_plugin_react_inline_editor(), vite_plugin_react_inline_editor_exports))).default;
    editModeDevPlugin = (await Promise.resolve().then(() => (init_vite_plugin_edit_mode(), vite_plugin_edit_mode_exports))).default;
  } catch (error) {
    console.warn("Failed to load visual editor plugins:", error.message);
    inlineEditPlugin2 = null;
    editModeDevPlugin = null;
  }
}
var configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;
var configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;
var configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;
var configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this
		, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;
var addTransformIndexHtml = {
  name: "add-transform-index-html",
  transformIndexHtml(html) {
    const tags = [
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsRuntimeErrorHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsViteErrorHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configHorizonsConsoleErrroHandler,
        injectTo: "head"
      },
      {
        tag: "script",
        attrs: { type: "module" },
        children: configWindowFetchMonkeyPatch,
        injectTo: "head"
      }
    ];
    if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
      tags.push(
        {
          tag: "script",
          attrs: {
            src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
            "template-redirect-url": process.env.TEMPLATE_REDIRECT_URL
          },
          injectTo: "head"
        }
      );
    }
    return {
      html,
      tags
    };
  }
};
console.warn = () => {
};
var logger = createLogger();
var loggerError = logger.error;
logger.error = (msg, options) => {
  var _a;
  if ((_a = options == null ? void 0 : options.error) == null ? void 0 : _a.toString().includes("CssSyntaxError: [postcss]")) {
    return;
  }
  loggerError(msg, options);
};
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    customLogger: logger,
    plugins: [
      ...isDev && inlineEditPlugin2 && editModeDevPlugin ? [inlineEditPlugin2(), editModeDevPlugin()] : [],
      react(),
      addTransformIndexHtml
    ],
    server: {
      cors: true,
      headers: {
        "Cross-Origin-Embedder-Policy": "credentialless"
      },
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false
        },
        "/api/tiny": {
          target: "https://api.tiny.com.br",
          changeOrigin: true,
          rewrite: (path3) => path3.replace(/^\/api\/tiny/, "/api2"),
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
            });
          }
        }
      }
    },
    resolve: {
      extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      rollupOptions: {
        external: [
          "@babel/parser",
          "@babel/traverse",
          "@babel/generator",
          "@babel/types"
        ]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLXJlYWN0LWlubGluZS1lZGl0b3IuanMiLCAicGx1Z2lucy92aXN1YWwtZWRpdG9yL3Zpc3VhbC1lZGl0b3ItY29uZmlnLmpzIiwgInBsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1lZGl0LW1vZGUuanMiLCAidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnYWJyaVxcXFxEZXNrdG9wXFxcXFRyZW5kIFF1YWRyb3NcXFxcZGFzaGJvYXJkXFxcXHRyZW5kLXF1YWRyb3MtZGFzaGJvYXJkXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ2FicmlcXFxcRGVza3RvcFxcXFxUcmVuZCBRdWFkcm9zXFxcXGRhc2hib2FyZFxcXFx0cmVuZC1xdWFkcm9zLWRhc2hib2FyZFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcXFxcdml0ZS1wbHVnaW4tcmVhY3QtaW5saW5lLWVkaXRvci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZ2FicmkvRGVza3RvcC9UcmVuZCUyMFF1YWRyb3MvZGFzaGJvYXJkL3RyZW5kLXF1YWRyb3MtZGFzaGJvYXJkL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1yZWFjdC1pbmxpbmUtZWRpdG9yLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IHBhcnNlIH0gZnJvbSAnQGJhYmVsL3BhcnNlcic7XG5pbXBvcnQgdHJhdmVyc2VCYWJlbCBmcm9tICdAYmFiZWwvdHJhdmVyc2UnO1xuaW1wb3J0IGdlbmVyYXRlIGZyb20gJ0BiYWJlbC9nZW5lcmF0b3InO1xuaW1wb3J0ICogYXMgdCBmcm9tICdAYmFiZWwvdHlwZXMnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcbmNvbnN0IFZJVEVfUFJPSkVDVF9ST09UID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uJyk7XG5jb25zdCBFRElUQUJMRV9IVE1MX1RBR1MgPSBbXCJhXCIsIFwiQnV0dG9uXCIsIFwiYnV0dG9uXCIsIFwicFwiLCBcInNwYW5cIiwgXCJoMVwiLCBcImgyXCIsIFwiaDNcIiwgXCJoNFwiLCBcImg1XCIsIFwiaDZcIiwgXCJsYWJlbFwiLCBcIkxhYmVsXCIsIFwiaW1nXCJdO1xuXG5mdW5jdGlvbiBwYXJzZUVkaXRJZChlZGl0SWQpIHtcbiAgY29uc3QgcGFydHMgPSBlZGl0SWQuc3BsaXQoJzonKTtcblxuICBpZiAocGFydHMubGVuZ3RoIDwgMykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgY29sdW1uID0gcGFyc2VJbnQocGFydHMuYXQoLTEpLCAxMCk7XG4gIGNvbnN0IGxpbmUgPSBwYXJzZUludChwYXJ0cy5hdCgtMiksIDEwKTtcbiAgY29uc3QgZmlsZVBhdGggPSBwYXJ0cy5zbGljZSgwLCAtMikuam9pbignOicpO1xuXG4gIGlmICghZmlsZVBhdGggfHwgaXNOYU4obGluZSkgfHwgaXNOYU4oY29sdW1uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHsgZmlsZVBhdGgsIGxpbmUsIGNvbHVtbiB9O1xufVxuXG5mdW5jdGlvbiBjaGVja1RhZ05hbWVFZGl0YWJsZShvcGVuaW5nRWxlbWVudE5vZGUsIGVkaXRhYmxlVGFnc0xpc3QpIHtcbiAgICBpZiAoIW9wZW5pbmdFbGVtZW50Tm9kZSB8fCAhb3BlbmluZ0VsZW1lbnROb2RlLm5hbWUpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBuYW1lTm9kZSA9IG9wZW5pbmdFbGVtZW50Tm9kZS5uYW1lO1xuXG4gICAgLy8gQ2hlY2sgMTogRGlyZWN0IG5hbWUgKGZvciA8cD4sIDxCdXR0b24+KVxuICAgIGlmIChuYW1lTm9kZS50eXBlID09PSAnSlNYSWRlbnRpZmllcicgJiYgZWRpdGFibGVUYWdzTGlzdC5pbmNsdWRlcyhuYW1lTm9kZS5uYW1lKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayAyOiBQcm9wZXJ0eSBuYW1lIG9mIGEgbWVtYmVyIGV4cHJlc3Npb24gKGZvciA8bW90aW9uLmgxPiwgY2hlY2sgaWYgXCJoMVwiIGlzIGluIGVkaXRhYmxlVGFnc0xpc3QpXG4gICAgaWYgKG5hbWVOb2RlLnR5cGUgPT09ICdKU1hNZW1iZXJFeHByZXNzaW9uJyAmJiBuYW1lTm9kZS5wcm9wZXJ0eSAmJiBuYW1lTm9kZS5wcm9wZXJ0eS50eXBlID09PSAnSlNYSWRlbnRpZmllcicgJiYgZWRpdGFibGVUYWdzTGlzdC5pbmNsdWRlcyhuYW1lTm9kZS5wcm9wZXJ0eS5uYW1lKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlSW1hZ2VTcmMob3BlbmluZ05vZGUpIHtcbiAgICBpZiAoIW9wZW5pbmdOb2RlIHx8ICFvcGVuaW5nTm9kZS5uYW1lIHx8IG9wZW5pbmdOb2RlLm5hbWUubmFtZSAhPT0gJ2ltZycpIHtcbiAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogdHJ1ZSwgcmVhc29uOiBudWxsIH07IC8vIE5vdCBhbiBpbWFnZSwgc2tpcCB2YWxpZGF0aW9uXG4gICAgfVxuXG4gICAgY29uc3QgaGFzUHJvcHNTcHJlYWQgPSBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnNvbWUoYXR0ciA9PlxuICAgICAgICB0LmlzSlNYU3ByZWFkQXR0cmlidXRlKGF0dHIpICYmXG4gICAgICAgIGF0dHIuYXJndW1lbnQgJiZcbiAgICAgICAgdC5pc0lkZW50aWZpZXIoYXR0ci5hcmd1bWVudCkgJiZcbiAgICAgICAgYXR0ci5hcmd1bWVudC5uYW1lID09PSAncHJvcHMnXG4gICAgKTtcblxuICAgIGlmIChoYXNQcm9wc1NwcmVhZCkge1xuICAgICAgICByZXR1cm4geyBpc1ZhbGlkOiBmYWxzZSwgcmVhc29uOiAncHJvcHMtc3ByZWFkJyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHNyY0F0dHIgPSBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLmZpbmQoYXR0ciA9PlxuICAgICAgICB0LmlzSlNYQXR0cmlidXRlKGF0dHIpICYmXG4gICAgICAgIGF0dHIubmFtZSAmJlxuICAgICAgICBhdHRyLm5hbWUubmFtZSA9PT0gJ3NyYydcbiAgICApO1xuXG4gICAgaWYgKCFzcmNBdHRyKSB7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLXNyYycgfTtcbiAgICB9XG5cbiAgICBpZiAoIXQuaXNTdHJpbmdMaXRlcmFsKHNyY0F0dHIudmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCByZWFzb246ICdkeW5hbWljLXNyYycgfTtcbiAgICB9XG5cbiAgICBpZiAoIXNyY0F0dHIudmFsdWUudmFsdWUgfHwgc3JjQXR0ci52YWx1ZS52YWx1ZS50cmltKCkgPT09ICcnKSB7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCByZWFzb246ICdlbXB0eS1zcmMnIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgaXNWYWxpZDogdHJ1ZSwgcmVhc29uOiBudWxsIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlubGluZUVkaXRQbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtaW5saW5lLWVkaXQtcGx1Z2luJyxcbiAgICBlbmZvcmNlOiAncHJlJyxcblxuICAgIHRyYW5zZm9ybShjb2RlLCBpZCkge1xuICAgICAgaWYgKCEvXFwuKGpzeHx0c3gpJC8udGVzdChpZCkgfHwgIWlkLnN0YXJ0c1dpdGgoVklURV9QUk9KRUNUX1JPT1QpIHx8IGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IHBhdGgucmVsYXRpdmUoVklURV9QUk9KRUNUX1JPT1QsIGlkKTtcbiAgICAgIGNvbnN0IHdlYlJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZUZpbGVQYXRoLnNwbGl0KHBhdGguc2VwKS5qb2luKCcvJyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJhYmVsQXN0ID0gcGFyc2UoY29kZSwge1xuICAgICAgICAgIHNvdXJjZVR5cGU6ICdtb2R1bGUnLFxuICAgICAgICAgIHBsdWdpbnM6IFsnanN4JywgJ3R5cGVzY3JpcHQnXSxcbiAgICAgICAgICBlcnJvclJlY292ZXJ5OiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBhdHRyaWJ1dGVzQWRkZWQgPSAwO1xuXG4gICAgICAgIHRyYXZlcnNlQmFiZWwuZGVmYXVsdChiYWJlbEFzdCwge1xuICAgICAgICAgIGVudGVyKHBhdGgpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmlzSlNYT3BlbmluZ0VsZW1lbnQoKSkge1xuICAgICAgICAgICAgICBjb25zdCBvcGVuaW5nTm9kZSA9IHBhdGgubm9kZTtcbiAgICAgICAgICAgICAgY29uc3QgZWxlbWVudE5vZGUgPSBwYXRoLnBhcmVudFBhdGgubm9kZTsgLy8gVGhlIEpTWEVsZW1lbnQgaXRzZWxmXG5cbiAgICAgICAgICAgICAgaWYgKCFvcGVuaW5nTm9kZS5sb2MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBhbHJlYWR5SGFzSWQgPSBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnNvbWUoXG4gICAgICAgICAgICAgICAgKGF0dHIpID0+IHQuaXNKU1hBdHRyaWJ1dGUoYXR0cikgJiYgYXR0ci5uYW1lLm5hbWUgPT09ICdkYXRhLWVkaXQtaWQnXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgaWYgKGFscmVhZHlIYXNJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIENvbmRpdGlvbiAxOiBJcyB0aGUgY3VycmVudCBlbGVtZW50IHRhZyB0eXBlIGVkaXRhYmxlP1xuICAgICAgICAgICAgICBjb25zdCBpc0N1cnJlbnRFbGVtZW50RWRpdGFibGUgPSBjaGVja1RhZ05hbWVFZGl0YWJsZShvcGVuaW5nTm9kZSwgRURJVEFCTEVfSFRNTF9UQUdTKTtcbiAgICAgICAgICAgICAgaWYgKCFpc0N1cnJlbnRFbGVtZW50RWRpdGFibGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBpbWFnZVZhbGlkYXRpb24gPSB2YWxpZGF0ZUltYWdlU3JjKG9wZW5pbmdOb2RlKTtcbiAgICAgICAgICAgICAgaWYgKCFpbWFnZVZhbGlkYXRpb24uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkQXR0cmlidXRlID0gdC5qc3hBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICB0LmpzeElkZW50aWZpZXIoJ2RhdGEtZWRpdC1kaXNhYmxlZCcpLFxuICAgICAgICAgICAgICAgICAgdC5zdHJpbmdMaXRlcmFsKCd0cnVlJylcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMucHVzaChkaXNhYmxlZEF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc0FkZGVkKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgbGV0IHNob3VsZEJlRGlzYWJsZWREdWVUb0NoaWxkcmVuID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgLy8gQ29uZGl0aW9uIDI6IERvZXMgdGhlIGVsZW1lbnQgaGF2ZSBkeW5hbWljIG9yIGVkaXRhYmxlIGNoaWxkcmVuXG4gICAgICAgICAgICAgIGlmICh0LmlzSlNYRWxlbWVudChlbGVtZW50Tm9kZSkgJiYgZWxlbWVudE5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBlbGVtZW50IGhhcyB7Li4ucHJvcHN9IHNwcmVhZCBhdHRyaWJ1dGUgLSBkaXNhYmxlIGVkaXRpbmcgaWYgaXQgZG9lc1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1Byb3BzU3ByZWFkID0gb3BlbmluZ05vZGUuYXR0cmlidXRlcy5zb21lKGF0dHIgPT4gdC5pc0pTWFNwcmVhZEF0dHJpYnV0ZShhdHRyKVxuICAgICAgICAgICAgICAgICYmIGF0dHIuYXJndW1lbnRcbiAgICAgICAgICAgICAgICAmJiB0LmlzSWRlbnRpZmllcihhdHRyLmFyZ3VtZW50KVxuICAgICAgICAgICAgICAgICYmIGF0dHIuYXJndW1lbnQubmFtZSA9PT0gJ3Byb3BzJ1xuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBoYXNEeW5hbWljQ2hpbGQgPSBlbGVtZW50Tm9kZS5jaGlsZHJlbi5zb21lKGNoaWxkID0+XG4gICAgICAgICAgICAgICAgICB0LmlzSlNYRXhwcmVzc2lvbkNvbnRhaW5lcihjaGlsZClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0R5bmFtaWNDaGlsZCB8fCBoYXNQcm9wc1NwcmVhZCkge1xuICAgICAgICAgICAgICAgICAgc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICghc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4gJiYgdC5pc0pTWEVsZW1lbnQoZWxlbWVudE5vZGUpICYmIGVsZW1lbnROb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzRWRpdGFibGVKc3hDaGlsZCA9IGVsZW1lbnROb2RlLmNoaWxkcmVuLnNvbWUoY2hpbGQgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHQuaXNKU1hFbGVtZW50KGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hlY2tUYWdOYW1lRWRpdGFibGUoY2hpbGQub3BlbmluZ0VsZW1lbnQsIEVESVRBQkxFX0hUTUxfVEFHUyk7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChoYXNFZGl0YWJsZUpzeENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICBzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHNob3VsZEJlRGlzYWJsZWREdWVUb0NoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzYWJsZWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgIHQuanN4SWRlbnRpZmllcignZGF0YS1lZGl0LWRpc2FibGVkJyksXG4gICAgICAgICAgICAgICAgICB0LnN0cmluZ0xpdGVyYWwoJ3RydWUnKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnB1c2goZGlzYWJsZWRBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNBZGRlZCsrO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIENvbmRpdGlvbiAzOiBQYXJlbnQgaXMgbm9uLWVkaXRhYmxlIGlmIEFUIExFQVNUIE9ORSBjaGlsZCBKU1hFbGVtZW50IGlzIGEgbm9uLWVkaXRhYmxlIHR5cGUuXG4gICAgICAgICAgICAgIGlmICh0LmlzSlNYRWxlbWVudChlbGVtZW50Tm9kZSkgJiYgZWxlbWVudE5vZGUuY2hpbGRyZW4gJiYgZWxlbWVudE5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgbGV0IGhhc05vbkVkaXRhYmxlSnN4Q2hpbGQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZWxlbWVudE5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAodC5pc0pTWEVsZW1lbnQoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tUYWdOYW1lRWRpdGFibGUoY2hpbGQub3BlbmluZ0VsZW1lbnQsIEVESVRBQkxFX0hUTUxfVEFHUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc05vbkVkaXRhYmxlSnN4Q2hpbGQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoaGFzTm9uRWRpdGFibGVKc3hDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc2FibGVkQXR0cmlidXRlID0gdC5qc3hBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICAgICAgICB0LmpzeElkZW50aWZpZXIoJ2RhdGEtZWRpdC1kaXNhYmxlZCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdC5zdHJpbmdMaXRlcmFsKFwidHJ1ZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgb3BlbmluZ05vZGUuYXR0cmlidXRlcy5wdXNoKGRpc2FibGVkQXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzQWRkZWQrKztcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBDb25kaXRpb24gNDogSXMgYW55IGFuY2VzdG9yIEpTWEVsZW1lbnQgYWxzbyBlZGl0YWJsZT9cbiAgICAgICAgICAgICAgbGV0IGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGggPSBwYXRoLnBhcmVudFBhdGgucGFyZW50UGF0aDtcbiAgICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFuY2VzdG9ySnN4RWxlbWVudFBhdGggPSBjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoLmlzSlNYRWxlbWVudCgpXG4gICAgICAgICAgICAgICAgICAgICAgPyBjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoXG4gICAgICAgICAgICAgICAgICAgICAgOiBjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoLmZpbmRQYXJlbnQocCA9PiBwLmlzSlNYRWxlbWVudCgpKTtcblxuICAgICAgICAgICAgICAgICAgaWYgKCFhbmNlc3RvckpzeEVsZW1lbnRQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChjaGVja1RhZ05hbWVFZGl0YWJsZShhbmNlc3RvckpzeEVsZW1lbnRQYXRoLm5vZGUub3BlbmluZ0VsZW1lbnQsIEVESVRBQkxFX0hUTUxfVEFHUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBjdXJyZW50QW5jZXN0b3JDYW5kaWRhdGVQYXRoID0gYW5jZXN0b3JKc3hFbGVtZW50UGF0aC5wYXJlbnRQYXRoO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgbGluZSA9IG9wZW5pbmdOb2RlLmxvYy5zdGFydC5saW5lO1xuICAgICAgICAgICAgICBjb25zdCBjb2x1bW4gPSBvcGVuaW5nTm9kZS5sb2Muc3RhcnQuY29sdW1uICsgMTtcbiAgICAgICAgICAgICAgY29uc3QgZWRpdElkID0gYCR7d2ViUmVsYXRpdmVGaWxlUGF0aH06JHtsaW5lfToke2NvbHVtbn1gO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGlkQXR0cmlidXRlID0gdC5qc3hBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgdC5qc3hJZGVudGlmaWVyKCdkYXRhLWVkaXQtaWQnKSxcbiAgICAgICAgICAgICAgICB0LnN0cmluZ0xpdGVyYWwoZWRpdElkKVxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMucHVzaChpZEF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXNBZGRlZCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNBZGRlZCA+IDApIHtcbiAgICAgICAgICBjb25zdCBnZW5lcmF0ZUZ1bmN0aW9uID0gZ2VuZXJhdGUuZGVmYXVsdCB8fCBnZW5lcmF0ZTtcbiAgICAgICAgICBjb25zdCBvdXRwdXQgPSBnZW5lcmF0ZUZ1bmN0aW9uKGJhYmVsQXN0LCB7XG4gICAgICAgICAgICBzb3VyY2VNYXBzOiB0cnVlLFxuICAgICAgICAgICAgc291cmNlRmlsZU5hbWU6IHdlYlJlbGF0aXZlRmlsZVBhdGhcbiAgICAgICAgICB9LCBjb2RlKTtcblxuICAgICAgICAgIHJldHVybiB7IGNvZGU6IG91dHB1dC5jb2RlLCBtYXA6IG91dHB1dC5tYXAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW3ZpdGVdW3Zpc3VhbC1lZGl0b3JdIEVycm9yIHRyYW5zZm9ybWluZyAke2lkfTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0sXG5cblxuICAgIC8vIFVwZGF0ZXMgc291cmNlIGNvZGUgYmFzZWQgb24gdGhlIGNoYW5nZXMgcmVjZWl2ZWQgZnJvbSB0aGUgY2xpZW50XG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9hcHBseS1lZGl0JywgYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgICAgbGV0IGJvZHkgPSAnJztcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4geyBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7IH0pO1xuXG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGxldCBhYnNvbHV0ZUZpbGVQYXRoID0gJyc7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZWRpdElkLCBuZXdGdWxsVGV4dCB9ID0gSlNPTi5wYXJzZShib2R5KTtcblxuICAgICAgICAgICAgaWYgKCFlZGl0SWQgfHwgdHlwZW9mIG5ld0Z1bGxUZXh0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyBlZGl0SWQgb3IgbmV3RnVsbFRleHQnIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyc2VkSWQgPSBwYXJzZUVkaXRJZChlZGl0SWQpO1xuICAgICAgICAgICAgaWYgKCFwYXJzZWRJZCkge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW52YWxpZCBlZGl0SWQgZm9ybWF0IChmaWxlUGF0aDpsaW5lOmNvbHVtbiknIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBmaWxlUGF0aCwgbGluZSwgY29sdW1uIH0gPSBwYXJzZWRJZDtcblxuICAgICAgICAgICAgYWJzb2x1dGVGaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShWSVRFX1BST0pFQ1RfUk9PVCwgZmlsZVBhdGgpO1xuICAgICAgICAgICAgaWYgKGZpbGVQYXRoLmluY2x1ZGVzKCcuLicpIHx8ICFhYnNvbHV0ZUZpbGVQYXRoLnN0YXJ0c1dpdGgoVklURV9QUk9KRUNUX1JPT1QpIHx8IGFic29sdXRlRmlsZVBhdGguaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnZhbGlkIHBhdGgnIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGFic29sdXRlRmlsZVBhdGgsICd1dGYtOCcpO1xuXG4gICAgICAgICAgICBjb25zdCBiYWJlbEFzdCA9IHBhcnNlKG9yaWdpbmFsQ29udGVudCwge1xuICAgICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgICAgcGx1Z2luczogWydqc3gnLCAndHlwZXNjcmlwdCddLFxuICAgICAgICAgICAgICBlcnJvclJlY292ZXJ5OiB0cnVlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IHRhcmdldE5vZGVQYXRoID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHZpc2l0b3IgPSB7XG4gICAgICAgICAgICAgIEpTWE9wZW5pbmdFbGVtZW50KHBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlO1xuICAgICAgICAgICAgICAgIGlmIChub2RlLmxvYyAmJiBub2RlLmxvYy5zdGFydC5saW5lID09PSBsaW5lICYmIG5vZGUubG9jLnN0YXJ0LmNvbHVtbiArIDEgPT09IGNvbHVtbikge1xuICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZVBhdGggPSBwYXRoO1xuICAgICAgICAgICAgICAgICAgcGF0aC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdHJhdmVyc2VCYWJlbC5kZWZhdWx0KGJhYmVsQXN0LCB2aXNpdG9yKTtcblxuICAgICAgICAgICAgaWYgKCF0YXJnZXROb2RlUGF0aCkge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnVGFyZ2V0IG5vZGUgbm90IGZvdW5kIGJ5IGxpbmUvY29sdW1uJywgZWRpdElkIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZ2VuZXJhdGVGdW5jdGlvbiA9IGdlbmVyYXRlLmRlZmF1bHQgfHwgZ2VuZXJhdGU7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRPcGVuaW5nRWxlbWVudCA9IHRhcmdldE5vZGVQYXRoLm5vZGU7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRFbGVtZW50Tm9kZSA9IHRhcmdldE5vZGVQYXRoLnBhcmVudFBhdGg/Lm5vZGU7XG5cbiAgICAgICAgICAgIGNvbnN0IGlzSW1hZ2VFbGVtZW50ID0gdGFyZ2V0T3BlbmluZ0VsZW1lbnQubmFtZSAmJiB0YXJnZXRPcGVuaW5nRWxlbWVudC5uYW1lLm5hbWUgPT09ICdpbWcnO1xuXG4gICAgICAgICAgICBsZXQgYmVmb3JlQ29kZSA9ICcnO1xuICAgICAgICAgICAgbGV0IGFmdGVyQ29kZSA9ICcnO1xuICAgICAgICAgICAgbGV0IG1vZGlmaWVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChpc0ltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgICAvLyBIYW5kbGUgaW1hZ2Ugc3JjIGF0dHJpYnV0ZSB1cGRhdGVcbiAgICAgICAgICAgICAgY29uc3QgYmVmb3JlT3V0cHV0ID0gZ2VuZXJhdGVGdW5jdGlvbih0YXJnZXRPcGVuaW5nRWxlbWVudCwge30pO1xuICAgICAgICAgICAgICBiZWZvcmVDb2RlID0gYmVmb3JlT3V0cHV0LmNvZGU7XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3JjQXR0ciA9IHRhcmdldE9wZW5pbmdFbGVtZW50LmF0dHJpYnV0ZXMuZmluZChhdHRyID0+XG4gICAgICAgICAgICAgICAgdC5pc0pTWEF0dHJpYnV0ZShhdHRyKSAmJiBhdHRyLm5hbWUgJiYgYXR0ci5uYW1lLm5hbWUgPT09ICdzcmMnXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgaWYgKHNyY0F0dHIgJiYgdC5pc1N0cmluZ0xpdGVyYWwoc3JjQXR0ci52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBzcmNBdHRyLnZhbHVlID0gdC5zdHJpbmdMaXRlcmFsKG5ld0Z1bGxUZXh0KTtcbiAgICAgICAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlck91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24odGFyZ2V0T3BlbmluZ0VsZW1lbnQsIHt9KTtcbiAgICAgICAgICAgICAgICBhZnRlckNvZGUgPSBhZnRlck91dHB1dC5jb2RlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAocGFyZW50RWxlbWVudE5vZGUgJiYgdC5pc0pTWEVsZW1lbnQocGFyZW50RWxlbWVudE5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmVmb3JlT3V0cHV0ID0gZ2VuZXJhdGVGdW5jdGlvbihwYXJlbnRFbGVtZW50Tm9kZSwge30pO1xuICAgICAgICAgICAgICAgIGJlZm9yZUNvZGUgPSBiZWZvcmVPdXRwdXQuY29kZTtcblxuICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnROb2RlLmNoaWxkcmVuID0gW107XG4gICAgICAgICAgICAgICAgaWYgKG5ld0Z1bGxUZXh0ICYmIG5ld0Z1bGxUZXh0LnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RleHROb2RlID0gdC5qc3hUZXh0KG5ld0Z1bGxUZXh0KTtcbiAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnROb2RlLmNoaWxkcmVuLnB1c2gobmV3VGV4dE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlck91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24ocGFyZW50RWxlbWVudE5vZGUsIHt9KTtcbiAgICAgICAgICAgICAgICBhZnRlckNvZGUgPSBhZnRlck91dHB1dC5jb2RlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbW9kaWZpZWQpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDksIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0NvdWxkIG5vdCBhcHBseSBjaGFuZ2VzIHRvIEFTVC4nIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gZ2VuZXJhdGVGdW5jdGlvbihiYWJlbEFzdCwge30pO1xuICAgICAgICAgICAgY29uc3QgbmV3Q29udGVudCA9IG91dHB1dC5jb2RlO1xuXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBuZXdGaWxlQ29udGVudDogbmV3Q29udGVudCxcbiAgICAgICAgICAgICAgICBiZWZvcmVDb2RlLFxuICAgICAgICAgICAgICAgIGFmdGVyQ29kZSxcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGR1cmluZyBlZGl0IGFwcGxpY2F0aW9uLicgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnYWJyaVxcXFxEZXNrdG9wXFxcXFRyZW5kIFF1YWRyb3NcXFxcZGFzaGJvYXJkXFxcXHRyZW5kLXF1YWRyb3MtZGFzaGJvYXJkXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ2FicmlcXFxcRGVza3RvcFxcXFxUcmVuZCBRdWFkcm9zXFxcXGRhc2hib2FyZFxcXFx0cmVuZC1xdWFkcm9zLWRhc2hib2FyZFxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcXFxcdmlzdWFsLWVkaXRvci1jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2dhYnJpL0Rlc2t0b3AvVHJlbmQlMjBRdWFkcm9zL2Rhc2hib2FyZC90cmVuZC1xdWFkcm9zLWRhc2hib2FyZC9wbHVnaW5zL3Zpc3VhbC1lZGl0b3IvdmlzdWFsLWVkaXRvci1jb25maWcuanNcIjtleHBvcnQgY29uc3QgUE9QVVBfU1RZTEVTID0gYFxuI2lubGluZS1lZGl0b3ItcG9wdXAge1xuICB3aWR0aDogMzYwcHg7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgei1pbmRleDogMTAwMDA7XG4gIGJhY2tncm91bmQ6ICMxNjE3MTg7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgYm9yZGVyOiAxcHggc29saWQgIzRhNTU2ODtcbiAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgcGFkZGluZzogOHB4O1xuICBib3gtc2hhZG93OiAwIDRweCAxMnB4IHJnYmEoMCwwLDAsMC4yKTtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiAxMHB4O1xuICBkaXNwbGF5OiBub25lO1xufVxuXG5AbWVkaWEgKG1heC13aWR0aDogNzY4cHgpIHtcbiAgI2lubGluZS1lZGl0b3ItcG9wdXAge1xuICAgIHdpZHRoOiBjYWxjKDEwMCUgLSAyMHB4KTtcbiAgfVxufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cC5pcy1hY3RpdmUge1xuICBkaXNwbGF5OiBmbGV4O1xuICB0b3A6IDUwJTtcbiAgbGVmdDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTtcbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAuaXMtZGlzYWJsZWQtdmlldyB7XG4gIHBhZGRpbmc6IDEwcHggMTVweDtcbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAgdGV4dGFyZWEge1xuICBoZWlnaHQ6IDEwMHB4O1xuICBwYWRkaW5nOiA0cHggOHB4O1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgY29sb3I6IHdoaXRlO1xuICBmb250LWZhbWlseTogaW5oZXJpdDtcbiAgZm9udC1zaXplOiAwLjg3NXJlbTtcbiAgbGluZS1oZWlnaHQ6IDEuNDI7XG4gIHJlc2l6ZTogbm9uZTtcbiAgb3V0bGluZTogbm9uZTtcbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAgLmJ1dHRvbi1jb250YWluZXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICBnYXA6IDEwcHg7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIC5wb3B1cC1idXR0b24ge1xuICBib3JkZXI6IG5vbmU7XG4gIHBhZGRpbmc6IDZweCAxNnB4O1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC1zaXplOiAwLjc1cmVtO1xuICBmb250LXdlaWdodDogNzAwO1xuICBoZWlnaHQ6IDM0cHg7XG4gIG91dGxpbmU6IG5vbmU7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIC5zYXZlLWJ1dHRvbiB7XG4gIGJhY2tncm91bmQ6ICM2NzNkZTY7XG4gIGNvbG9yOiB3aGl0ZTtcbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAgLmNhbmNlbC1idXR0b24ge1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgYm9yZGVyOiAxcHggc29saWQgIzNiM2Q0YTtcbiAgY29sb3I6IHdoaXRlO1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAuY2FuY2VsLWJ1dHRvbjpob3ZlciB7XG4gIGJhY2tncm91bmQ6ICM0NzQ5NTg7XG59XG5gO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9wdXBIVE1MVGVtcGxhdGUoc2F2ZUxhYmVsLCBjYW5jZWxMYWJlbCkge1xuICByZXR1cm4gYFxuICAgIDx0ZXh0YXJlYT48L3RleHRhcmVhPlxuICAgIDxkaXYgY2xhc3M9XCJidXR0b24tY29udGFpbmVyXCI+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwicG9wdXAtYnV0dG9uIGNhbmNlbC1idXR0b25cIj4ke2NhbmNlbExhYmVsfTwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiBjbGFzcz1cInBvcHVwLWJ1dHRvbiBzYXZlLWJ1dHRvblwiPiR7c2F2ZUxhYmVsfTwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICBgO1xufTtcblxuZXhwb3J0IGNvbnN0IEVESVRfTU9ERV9TVFlMRVMgPSBgXG4gICNyb290W2RhdGEtZWRpdC1tb2RlLWVuYWJsZWQ9XCJ0cnVlXCJdIFtkYXRhLWVkaXQtaWRdIHtcbiAgICBjdXJzb3I6IHBvaW50ZXI7IFxuICAgIG91dGxpbmU6IDFweCBkYXNoZWQgIzM1N0RGOTsgXG4gICAgb3V0bGluZS1vZmZzZXQ6IDJweDtcbiAgICBtaW4taGVpZ2h0OiAxZW07XG4gIH1cbiAgI3Jvb3RbZGF0YS1lZGl0LW1vZGUtZW5hYmxlZD1cInRydWVcIl0ge1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuICAjcm9vdFtkYXRhLWVkaXQtbW9kZS1lbmFibGVkPVwidHJ1ZVwiXSBbZGF0YS1lZGl0LWlkXTpob3ZlciB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzM1N0RGOTMzO1xuICAgIG91dGxpbmUtY29sb3I6ICMzNTdERjk7IFxuICB9XG5cbiAgQGtleWZyYW1lcyBmYWRlSW5Ub29sdGlwIHtcbiAgICBmcm9tIHtcbiAgICAgIG9wYWNpdHk6IDA7XG4gICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoNXB4KTtcbiAgICB9XG4gICAgdG8ge1xuICAgICAgb3BhY2l0eTogMTtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTtcbiAgICB9XG4gIH1cblxuICAjaW5saW5lLWVkaXRvci1kaXNhYmxlZC10b29sdGlwIHtcbiAgICBkaXNwbGF5OiBub25lOyBcbiAgICBvcGFjaXR5OiAwOyBcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzFEMUUyMDtcbiAgICBjb2xvcjogd2hpdGU7XG4gICAgcGFkZGluZzogNHB4IDhweDtcbiAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgei1pbmRleDogMTAwMDE7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICMzQjNENEE7XG4gICAgbWF4LXdpZHRoOiAxODRweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICAjaW5saW5lLWVkaXRvci1kaXNhYmxlZC10b29sdGlwLnRvb2x0aXAtYWN0aXZlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBhbmltYXRpb246IGZhZGVJblRvb2x0aXAgMC4ycyBlYXNlLW91dCBmb3J3YXJkcztcbiAgfVxuYDsiLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGdhYnJpXFxcXERlc2t0b3BcXFxcVHJlbmQgUXVhZHJvc1xcXFxkYXNoYm9hcmRcXFxcdHJlbmQtcXVhZHJvcy1kYXNoYm9hcmRcXFxccGx1Z2luc1xcXFx2aXN1YWwtZWRpdG9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnYWJyaVxcXFxEZXNrdG9wXFxcXFRyZW5kIFF1YWRyb3NcXFxcZGFzaGJvYXJkXFxcXHRyZW5kLXF1YWRyb3MtZGFzaGJvYXJkXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclxcXFx2aXRlLXBsdWdpbi1lZGl0LW1vZGUuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2dhYnJpL0Rlc2t0b3AvVHJlbmQlMjBRdWFkcm9zL2Rhc2hib2FyZC90cmVuZC1xdWFkcm9zLWRhc2hib2FyZC9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tZWRpdC1tb2RlLmpzXCI7aW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBFRElUX01PREVfU1RZTEVTIH0gZnJvbSAnLi92aXN1YWwtZWRpdG9yLWNvbmZpZyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSByZXNvbHZlKF9fZmlsZW5hbWUsICcuLicpO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbmxpbmVFZGl0RGV2UGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2aXRlOmlubGluZS1lZGl0LWRldicsXG4gICAgYXBwbHk6ICdzZXJ2ZScsXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKCkge1xuICAgICAgY29uc3Qgc2NyaXB0UGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnZWRpdC1tb2RlLXNjcmlwdC5qcycpO1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IHJlYWRGaWxlU3luYyhzY3JpcHRQYXRoLCAndXRmLTgnKTtcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHRhZzogJ3NjcmlwdCcsXG4gICAgICAgICAgYXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcbiAgICAgICAgICBjaGlsZHJlbjogc2NyaXB0Q29udGVudCxcbiAgICAgICAgICBpbmplY3RUbzogJ2JvZHknXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0YWc6ICdzdHlsZScsXG4gICAgICAgICAgY2hpbGRyZW46IEVESVRfTU9ERV9TVFlMRVMsXG4gICAgICAgICAgaW5qZWN0VG86ICdoZWFkJ1xuICAgICAgICB9XG4gICAgICBdO1xuICAgIH1cbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ2FicmlcXFxcRGVza3RvcFxcXFxUcmVuZCBRdWFkcm9zXFxcXGRhc2hib2FyZFxcXFx0cmVuZC1xdWFkcm9zLWRhc2hib2FyZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ2FicmlcXFxcRGVza3RvcFxcXFxUcmVuZCBRdWFkcm9zXFxcXGRhc2hib2FyZFxcXFx0cmVuZC1xdWFkcm9zLWRhc2hib2FyZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZ2FicmkvRGVza3RvcC9UcmVuZCUyMFF1YWRyb3MvZGFzaGJvYXJkL3RyZW5kLXF1YWRyb3MtZGFzaGJvYXJkL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBjcmVhdGVMb2dnZXIsIGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbic7XG5sZXQgaW5saW5lRWRpdFBsdWdpbiwgZWRpdE1vZGVEZXZQbHVnaW47XG5cbmlmIChpc0Rldikge1xuXHR0cnkge1xuXHRcdGlubGluZUVkaXRQbHVnaW4gPSAoYXdhaXQgaW1wb3J0KCcuL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1yZWFjdC1pbmxpbmUtZWRpdG9yLmpzJykpLmRlZmF1bHQ7XG5cdFx0ZWRpdE1vZGVEZXZQbHVnaW4gPSAoYXdhaXQgaW1wb3J0KCcuL3BsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1lZGl0LW1vZGUuanMnKSkuZGVmYXVsdDtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBsb2FkIHZpc3VhbCBlZGl0b3IgcGx1Z2luczonLCBlcnJvci5tZXNzYWdlKTtcblx0XHRpbmxpbmVFZGl0UGx1Z2luID0gbnVsbDtcblx0XHRlZGl0TW9kZURldlBsdWdpbiA9IG51bGw7XG5cdH1cbn1cblxuY29uc3QgY29uZmlnSG9yaXpvbnNWaXRlRXJyb3JIYW5kbGVyID0gYFxuY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG5cdGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zKSB7XG5cdFx0Zm9yIChjb25zdCBhZGRlZE5vZGUgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHRhZGRlZE5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmXG5cdFx0XHRcdChcblx0XHRcdFx0XHRhZGRlZE5vZGUudGFnTmFtZT8udG9Mb3dlckNhc2UoKSA9PT0gJ3ZpdGUtZXJyb3Itb3ZlcmxheScgfHxcblx0XHRcdFx0XHRhZGRlZE5vZGUuY2xhc3NMaXN0Py5jb250YWlucygnYmFja2Ryb3AnKVxuXHRcdFx0XHQpXG5cdFx0XHQpIHtcblx0XHRcdFx0aGFuZGxlVml0ZU92ZXJsYXkoYWRkZWROb2RlKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0pO1xuXG5vYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwge1xuXHRjaGlsZExpc3Q6IHRydWUsXG5cdHN1YnRyZWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBoYW5kbGVWaXRlT3ZlcmxheShub2RlKSB7XG5cdGlmICghbm9kZS5zaGFkb3dSb290KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgYmFja2Ryb3AgPSBub2RlLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcignLmJhY2tkcm9wJyk7XG5cblx0aWYgKGJhY2tkcm9wKSB7XG5cdFx0Y29uc3Qgb3ZlcmxheUh0bWwgPSBiYWNrZHJvcC5vdXRlckhUTUw7XG5cdFx0Y29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuXHRcdGNvbnN0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcob3ZlcmxheUh0bWwsICd0ZXh0L2h0bWwnKTtcblx0XHRjb25zdCBtZXNzYWdlQm9keUVsZW1lbnQgPSBkb2MucXVlcnlTZWxlY3RvcignLm1lc3NhZ2UtYm9keScpO1xuXHRcdGNvbnN0IGZpbGVFbGVtZW50ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5maWxlJyk7XG5cdFx0Y29uc3QgbWVzc2FnZVRleHQgPSBtZXNzYWdlQm9keUVsZW1lbnQgPyBtZXNzYWdlQm9keUVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpIDogJyc7XG5cdFx0Y29uc3QgZmlsZVRleHQgPSBmaWxlRWxlbWVudCA/IGZpbGVFbGVtZW50LnRleHRDb250ZW50LnRyaW0oKSA6ICcnO1xuXHRcdGNvbnN0IGVycm9yID0gbWVzc2FnZVRleHQgKyAoZmlsZVRleHQgPyAnIEZpbGU6JyArIGZpbGVUZXh0IDogJycpO1xuXG5cdFx0d2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7XG5cdFx0XHR0eXBlOiAnaG9yaXpvbnMtdml0ZS1lcnJvcicsXG5cdFx0XHRlcnJvcixcblx0XHR9LCAnKicpO1xuXHR9XG59XG5gO1xuXG5jb25zdCBjb25maWdIb3Jpem9uc1J1bnRpbWVFcnJvckhhbmRsZXIgPSBgXG53aW5kb3cub25lcnJvciA9IChtZXNzYWdlLCBzb3VyY2UsIGxpbmVubywgY29sbm8sIGVycm9yT2JqKSA9PiB7XG5cdGNvbnN0IGVycm9yRGV0YWlscyA9IGVycm9yT2JqID8gSlNPTi5zdHJpbmdpZnkoe1xuXHRcdG5hbWU6IGVycm9yT2JqLm5hbWUsXG5cdFx0bWVzc2FnZTogZXJyb3JPYmoubWVzc2FnZSxcblx0XHRzdGFjazogZXJyb3JPYmouc3RhY2ssXG5cdFx0c291cmNlLFxuXHRcdGxpbmVubyxcblx0XHRjb2xubyxcblx0fSkgOiBudWxsO1xuXG5cdHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2Uoe1xuXHRcdHR5cGU6ICdob3Jpem9ucy1ydW50aW1lLWVycm9yJyxcblx0XHRtZXNzYWdlLFxuXHRcdGVycm9yOiBlcnJvckRldGFpbHNcblx0fSwgJyonKTtcbn07XG5gO1xuXG5jb25zdCBjb25maWdIb3Jpem9uc0NvbnNvbGVFcnJyb0hhbmRsZXIgPSBgXG5jb25zdCBvcmlnaW5hbENvbnNvbGVFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG5jb25zb2xlLmVycm9yID0gZnVuY3Rpb24oLi4uYXJncykge1xuXHRvcmlnaW5hbENvbnNvbGVFcnJvci5hcHBseShjb25zb2xlLCBhcmdzKTtcblxuXHRsZXQgZXJyb3JTdHJpbmcgPSAnJztcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBhcmcgPSBhcmdzW2ldO1xuXHRcdGlmIChhcmcgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0ZXJyb3JTdHJpbmcgPSBhcmcuc3RhY2sgfHwgXFxgXFwke2FyZy5uYW1lfTogXFwke2FyZy5tZXNzYWdlfVxcYDtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdGlmICghZXJyb3JTdHJpbmcpIHtcblx0XHRlcnJvclN0cmluZyA9IGFyZ3MubWFwKGFyZyA9PiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KGFyZykgOiBTdHJpbmcoYXJnKSkuam9pbignICcpO1xuXHR9XG5cblx0d2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7XG5cdFx0dHlwZTogJ2hvcml6b25zLWNvbnNvbGUtZXJyb3InLFxuXHRcdGVycm9yOiBlcnJvclN0cmluZ1xuXHR9LCAnKicpO1xufTtcbmA7XG5cbmNvbnN0IGNvbmZpZ1dpbmRvd0ZldGNoTW9ua2V5UGF0Y2ggPSBgXG5jb25zdCBvcmlnaW5hbEZldGNoID0gd2luZG93LmZldGNoO1xuXG53aW5kb3cuZmV0Y2ggPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cdGNvbnN0IHVybCA9IGFyZ3NbMF0gaW5zdGFuY2VvZiBSZXF1ZXN0ID8gYXJnc1swXS51cmwgOiBhcmdzWzBdO1xuXG5cdC8vIFNraXAgV2ViU29ja2V0IFVSTHNcblx0aWYgKHVybC5zdGFydHNXaXRoKCd3czonKSB8fCB1cmwuc3RhcnRzV2l0aCgnd3NzOicpKSB7XG5cdFx0cmV0dXJuIG9yaWdpbmFsRmV0Y2guYXBwbHkodGhpc1xuXHRcdCwgYXJncyk7XG5cdH1cblxuXHRyZXR1cm4gb3JpZ2luYWxGZXRjaC5hcHBseSh0aGlzLCBhcmdzKVxuXHRcdC50aGVuKGFzeW5jIHJlc3BvbnNlID0+IHtcblx0XHRcdGNvbnN0IGNvbnRlbnRUeXBlID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpIHx8ICcnO1xuXG5cdFx0XHQvLyBFeGNsdWRlIEhUTUwgZG9jdW1lbnQgcmVzcG9uc2VzXG5cdFx0XHRjb25zdCBpc0RvY3VtZW50UmVzcG9uc2UgPVxuXHRcdFx0XHRjb250ZW50VHlwZS5pbmNsdWRlcygndGV4dC9odG1sJykgfHxcblx0XHRcdFx0Y29udGVudFR5cGUuaW5jbHVkZXMoJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcpO1xuXG5cdFx0XHRpZiAoIXJlc3BvbnNlLm9rICYmICFpc0RvY3VtZW50UmVzcG9uc2UpIHtcblx0XHRcdFx0XHRjb25zdCByZXNwb25zZUNsb25lID0gcmVzcG9uc2UuY2xvbmUoKTtcblx0XHRcdFx0XHRjb25zdCBlcnJvckZyb21SZXMgPSBhd2FpdCByZXNwb25zZUNsb25lLnRleHQoKTtcblx0XHRcdFx0XHRjb25zdCByZXF1ZXN0VXJsID0gcmVzcG9uc2UudXJsO1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoXFxgRmV0Y2ggZXJyb3IgZnJvbSBcXCR7cmVxdWVzdFVybH06IFxcJHtlcnJvckZyb21SZXN9XFxgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdH0pXG5cdFx0LmNhdGNoKGVycm9yID0+IHtcblx0XHRcdGlmICghdXJsLm1hdGNoKC9cXC5odG1sPyQvaSkpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0XHR9XG5cblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH0pO1xufTtcbmA7XG5cbmNvbnN0IGFkZFRyYW5zZm9ybUluZGV4SHRtbCA9IHtcblx0bmFtZTogJ2FkZC10cmFuc2Zvcm0taW5kZXgtaHRtbCcsXG5cdHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XG5cdFx0Y29uc3QgdGFncyA9IFtcblx0XHRcdHtcblx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0YXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcblx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ0hvcml6b25zUnVudGltZUVycm9ySGFuZGxlcixcblx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdGNoaWxkcmVuOiBjb25maWdIb3Jpem9uc1ZpdGVFcnJvckhhbmRsZXIsXG5cdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0YWc6ICdzY3JpcHQnLFxuXHRcdFx0XHRhdHRyczoge3R5cGU6ICdtb2R1bGUnfSxcblx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ0hvcml6b25zQ29uc29sZUVycnJvSGFuZGxlcixcblx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdGNoaWxkcmVuOiBjb25maWdXaW5kb3dGZXRjaE1vbmtleVBhdGNoLFxuXHRcdFx0XHRpbmplY3RUbzogJ2hlYWQnLFxuXHRcdFx0fSxcblx0XHRdO1xuXG5cdFx0aWYgKCFpc0RldiAmJiBwcm9jZXNzLmVudi5URU1QTEFURV9CQU5ORVJfU0NSSVBUX1VSTCAmJiBwcm9jZXNzLmVudi5URU1QTEFURV9SRURJUkVDVF9VUkwpIHtcblx0XHRcdHRhZ3MucHVzaChcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdFx0YXR0cnM6IHsgXG5cdFx0XHRcdFx0XHRzcmM6IHByb2Nlc3MuZW52LlRFTVBMQVRFX0JBTk5FUl9TQ1JJUFRfVVJMLFxuXHRcdFx0XHRcdFx0J3RlbXBsYXRlLXJlZGlyZWN0LXVybCc6IHByb2Nlc3MuZW52LlRFTVBMQVRFX1JFRElSRUNUX1VSTCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHRcdH1cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGh0bWwsXG5cdFx0XHR0YWdzLFxuXHRcdH07XG5cdH0sXG59O1xuXG5jb25zb2xlLndhcm4gPSAoKSA9PiB7fTtcblxuY29uc3QgbG9nZ2VyID0gY3JlYXRlTG9nZ2VyKClcbmNvbnN0IGxvZ2dlckVycm9yID0gbG9nZ2VyLmVycm9yXG5cbmxvZ2dlci5lcnJvciA9IChtc2csIG9wdGlvbnMpID0+IHtcblx0aWYgKG9wdGlvbnM/LmVycm9yPy50b1N0cmluZygpLmluY2x1ZGVzKCdDc3NTeW50YXhFcnJvcjogW3Bvc3Rjc3NdJykpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRsb2dnZXJFcnJvcihtc2csIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG5cdC8vIENhcnJlZ2FyIHZhcmlcdTAwRTF2ZWlzIGRlIGFtYmllbnRlXG5cdGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuXHRcblx0cmV0dXJuIHtcblx0XHRjdXN0b21Mb2dnZXI6IGxvZ2dlcixcblx0XHRwbHVnaW5zOiBbXG5cdFx0XHQuLi4oaXNEZXYgJiYgaW5saW5lRWRpdFBsdWdpbiAmJiBlZGl0TW9kZURldlBsdWdpbiA/IFtpbmxpbmVFZGl0UGx1Z2luKCksIGVkaXRNb2RlRGV2UGx1Z2luKCldIDogW10pLFxuXHRcdFx0cmVhY3QoKSxcblx0XHRcdGFkZFRyYW5zZm9ybUluZGV4SHRtbFxuXHRcdF0sXG5cdHNlcnZlcjoge1xuXHRcdGNvcnM6IHRydWUsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAnY3JlZGVudGlhbGxlc3MnLFxuXHRcdH0sXG5cdFx0YWxsb3dlZEhvc3RzOiB0cnVlLFxuXHRcdHByb3h5OiB7XG5cdFx0XHQnL2FwaSc6IHtcblx0XHRcdFx0dGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcblx0XHRcdFx0Y2hhbmdlT3JpZ2luOiB0cnVlLFxuXHRcdFx0XHRzZWN1cmU6IGZhbHNlLFxuXHRcdFx0fSxcblx0XHRcdCcvYXBpL3RpbnknOiB7XG5cdFx0XHRcdHRhcmdldDogJ2h0dHBzOi8vYXBpLnRpbnkuY29tLmJyJyxcblx0XHRcdFx0Y2hhbmdlT3JpZ2luOiB0cnVlLFxuXHRcdFx0XHRyZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvdGlueS8sICcvYXBpMicpLFxuXHRcdFx0XHRjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xuXHRcdFx0XHRcdHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCByZXMpID0+IHtcblx0XHRcdFx0XHRcdC8vIFByb3h5IHJlcXVlc3Rcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgcmVzKSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBQcm94eSByZXNwb25zZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRyZXNvbHZlOiB7XG5cdFx0ZXh0ZW5zaW9uczogWycuanN4JywgJy5qcycsICcudHN4JywgJy50cycsICcuanNvbicsIF0sXG5cdFx0YWxpYXM6IHtcblx0XHRcdCdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG5cdFx0fSxcblx0fSxcblx0YnVpbGQ6IHtcblx0XHRyb2xsdXBPcHRpb25zOiB7XG5cdFx0XHRleHRlcm5hbDogW1xuXHRcdFx0XHQnQGJhYmVsL3BhcnNlcicsXG5cdFx0XHRcdCdAYmFiZWwvdHJhdmVyc2UnLFxuXHRcdFx0XHQnQGJhYmVsL2dlbmVyYXRvcicsXG5cdFx0XHRcdCdAYmFiZWwvdHlwZXMnXG5cdFx0XHRdXG5cdFx0fVxuXHR9XG5cdH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBa2dCLE9BQU8sVUFBVTtBQUNuaEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxhQUFhO0FBQ3RCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sY0FBYztBQUNyQixZQUFZLE9BQU87QUFDbkIsT0FBTyxRQUFRO0FBT2YsU0FBUyxZQUFZLFFBQVE7QUFDM0IsUUFBTSxRQUFRLE9BQU8sTUFBTSxHQUFHO0FBRTlCLE1BQUksTUFBTSxTQUFTLEdBQUc7QUFDcEIsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLFNBQVMsU0FBUyxNQUFNLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDeEMsUUFBTSxPQUFPLFNBQVMsTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQ3RDLFFBQU0sV0FBVyxNQUFNLE1BQU0sR0FBRyxFQUFFLEVBQUUsS0FBSyxHQUFHO0FBRTVDLE1BQUks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
