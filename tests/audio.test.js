import test from 'node:test';import assert from 'node:assert/strict';import{splitText,pcm16,wavBlob,VOICES}from'../src/audio.js';
test('long text stays intact in bounded chunks',()=>{const s='A sentence. '+('longword '.repeat(1000))+'x'.repeat(750),c=splitText(s);assert.ok(c.every(x=>Array.from(x).length<=200));assert.equal(c.join('').replace(/\s/g,''),s.replace(/\s/g,''))});
test('WAV and PCM are valid',async()=>{assert.deepEqual([...pcm16([-2,-1,0,1,2])],[-32768,-32768,0,32767,32767]);const b=await wavBlob(new Float32Array(24000)).arrayBuffer(),v=new DataView(b);assert.equal(b.byteLength,48044);assert.equal(v.getUint32(24,true),24000);assert.equal(new TextDecoder().decode(b.slice(0,4)),'RIFF')});
test('catalog includes 28 female and male US/UK voices',()=>{assert.equal(new Set(VOICES.map(v=>v.id)).size,28);for(const g of['Female','Male'])for(const a of['American','British'])assert.ok(VOICES.some(v=>v.gender===g&&v.accent===a))});

