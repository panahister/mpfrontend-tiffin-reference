import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Field, Select } from '../src/index.js';

test('reference adapter composes the neutral package without copying it',()=>{
  const button=renderToStaticMarkup(createElement(Button,null,'Continue'));
  const field=renderToStaticMarkup(createElement(Field,{label:'Name',helper:'Required'}));
  const select=renderToStaticMarkup(createElement(Select,{label:'City'},createElement('option',null,'Dubai')));
  assert.match(button,/reference-ui/);
  assert.match(button,/mp-button inline-flex/);
  assert.match(field,/mp-field flex/);
  assert.match(select,/chevron-down/);
  assert.match(select,/mp-select-wrap relative w-full/);
});
