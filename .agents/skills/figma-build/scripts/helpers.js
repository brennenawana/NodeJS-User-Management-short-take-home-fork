// Shared preamble pasted at the top of every Figma Plugin API script that changes the file (no state persists between runs).
const _vars = await figma.variables.getLocalVariablesAsync(); const _vm = {}; for (const v of _vars) _vm[v.name] = v;
const V = n => { const v = _vm[n]; if (!v) throw new Error('var ' + n); return v; };
const _ts = await figma.getLocalTextStylesAsync(); const _tm = {}; for (const s of _ts) _tm[s.name] = s;
const _es = await figma.getLocalEffectStylesAsync(); const _em = {}; for (const s of _es) _em[s.name] = s;
await Promise.all(['Regular','SemiBold','Bold','ExtraBold'].map(s => figma.loadFontAsync({ family: 'Nunito', style: s })));
const paint = n => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V(n));
const fill = (node, n) => { node.fills = n ? [paint(n)] : []; return node; };
const stroke = (node, n, w = 1, dash) => { node.strokes = [paint(n)]; node.strokeWeight = w; node.strokeAlign = 'INSIDE'; if (dash) node.dashPattern = dash; return node; };
const radius = (node, n) => { for (const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) node.setBoundVariable(k, V('radius/' + n)); return node; };
const sp = (node, prop, v) => { if (_vm['space/' + v]) node.setBoundVariable(prop, V('space/' + v)); else node[prop] = v; };
const pad = (node, t, r, b, l) => { if (r === undefined) r = t; if (b === undefined) b = t; if (l === undefined) l = r; sp(node,'paddingTop',t); sp(node,'paddingRight',r); sp(node,'paddingBottom',b); sp(node,'paddingLeft',l); return node; };
const gap = (node, v) => { sp(node, 'itemSpacing', v); return node; };
const box = (dir, name, o = {}) => { const f = figma.createAutoLayout(dir); f.name = name; f.fills = []; f.clipsContent = false; if (o.w) { f.resize(o.w, o.h || 10); if (!o.h) { if (dir === 'VERTICAL') f.primaryAxisSizingMode = 'AUTO'; else f.counterAxisSizingMode = 'AUTO'; } } if (o.main) f.primaryAxisAlignItems = o.main; if (o.cross) f.counterAxisAlignItems = o.cross; if (o.wrap) f.layoutWrap = 'WRAP'; return f; };
const add = (parent, child, sz) => { parent.appendChild(child); if (sz) { if (sz.w) child.layoutSizingHorizontal = sz.w; if (sz.h) child.layoutSizingVertical = sz.h; } return child; };
const text = async (chars, style, colorName, name) => { const t = figma.createText(); t.name = name || chars.slice(0, 24); await t.setTextStyleIdAsync(_tm[style].id); t.characters = chars; fill(t, colorName); return t; };
const effect = (node, n) => { node.effectStyleId = _em[n].id; return node; };
const makeSet = (comps, name, desc, cols, g = 24, p = 24) => { const cs = figma.combineAsVariants(comps, figma.currentPage); cs.name = name; cs.description = desc; let x = p, y = p, rowH = 0, i = 0, maxW = 0; for (const c of cs.children) { if (i > 0 && i % cols === 0) { x = p; y += rowH + g; rowH = 0; } c.x = x; c.y = y; x += c.width + g; rowH = Math.max(rowH, c.height); maxW = Math.max(maxW, x); i++; } cs.resizeWithoutConstraints(maxW - g + p, y + rowH + p); return cs; };
const icon = (name, size, colorName) => { const comp = figma.currentPage.findOne(n => n.type === 'COMPONENT' && n.name === 'Icon / ' + name); if (!comp) throw new Error('icon ' + name); const i = comp.createInstance(); i.resize(size, size); if (colorName) { for (const v of i.findAllWithCriteria({ types: ['VECTOR','ELLIPSE','RECTANGLE'] })) { if (v.strokes.length) v.strokes = [paint(colorName)]; } } return i; };
const propKey = (inst, prefix) => Object.keys(inst.componentProperties).find(k => k.split('#')[0] === prefix);
const setP = (inst, obj) => { const o = {}; for (const [k, v] of Object.entries(obj)) { const key = propKey(inst, k); if (key) o[key] = v; } inst.setProperties(o); return inst; };
// Flexible spacer for an auto-layout row: append first, then FILL width and a 1px FIXED height (empty frames otherwise default to 100px tall).
const spacer = (parent) => { const f = figma.createFrame(); f.name = 'spacer'; f.fills = []; parent.appendChild(f); f.layoutSizingHorizontal = 'FILL'; f.layoutSizingVertical = 'FIXED'; f.resize(f.width, 1); return f; };
// Nested instance by path ID, e.g. nested(appHeaderInstance, '10:186') -> its ViewToggle. Works on fresh clones where mainComponent lookups fail.
const nested = (inst, childId) => figma.getNodeByIdAsync(`I${inst.id};${childId}`);
