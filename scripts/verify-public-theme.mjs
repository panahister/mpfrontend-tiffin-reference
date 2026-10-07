import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../themes/tiffin-dls/styles.css',import.meta.url),'utf8');
const readme=await readFile(new URL('../themes/tiffin-dls/README.md',import.meta.url),'utf8');
const required=[
  '--mp-action-primary','--mp-action-primaryhover','--mp-action-primarypressed',
  '--mp-action-secondary','--mp-action-secondaryhover','--mp-action-danger',
  '--mp-border-default','--mp-border-focus','--mp-border-strong','--mp-border-subtle',
  '--mp-focus-ring','--mp-foreground-primary','--mp-foreground-secondary',
  '--mp-foreground-muted','--mp-foreground-disabled','--mp-foreground-inverse',
  '--mp-surface-canvas','--mp-surface-panel','--mp-surface-raised','--mp-surface-overlay',
  '--mp-surface-subtle','--mp-surface-scrim','--mp-status-error','--mp-status-errorsurface',
  '--mp-status-success','--mp-status-successsurface','--mp-status-info','--mp-status-infosurface',
  '--mp-status-warning','--mp-status-warningsurface','--mp-radius-control','--mp-radius-surface',
  '--mp-radius-full'
];
assert.match(css,/:root\[data-brand="reference-dls"\]/);
assert.match(css,/:root\[data-brand="reference-dls"\]\[data-mode="dark"\]/);
assert.match(css,/@media \(prefers-color-scheme: dark\)/);
for(const token of required)assert.equal((css.match(new RegExp(token+':','g'))??[]).length,3,'PUBLIC_THEME_TOKEN:'+token);
const privateMarkers=['figma.com','"fileKey"','"sourcePage"','/Users/','/home/'];
for(const marker of privateMarkers){assert.equal(css.includes(marker),false,'PRIVATE_THEME_MARKER:'+marker);assert.equal(readme.includes(marker),false,'PRIVATE_THEME_DOC_MARKER:'+marker);}
console.log(JSON.stringify({ok:true,brand:'reference-dls',modes:['light','dark','system'],tokens:required.length,source:'independently-authored-public-sample'}));
