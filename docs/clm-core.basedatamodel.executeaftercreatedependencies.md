<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [clm-core](./clm-core.md) &gt; [BaseDatamodel](./clm-core.basedatamodel.md) &gt; [executeAfterCreateDependencies](./clm-core.basedatamodel.executeaftercreatedependencies.md)

## BaseDatamodel.executeAfterCreateDependencies() method

Execute steps after the document has been created. Will be executed by [BaseDAO](./clm-core.basedao.md)<!-- -->. and should not be executed by it's own. Similar to mongoose post-save-hook

<b>Signature:</b>

```typescript
/** @virtual */
executeAfterCreateDependencies(): Promise<any>;
```
<b>Returns:</b>

Promise&lt;any&gt;


