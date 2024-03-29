<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [clm-core](./clm-core.md) &gt; [RelationBDTO](./clm-core.relationbdto.md) &gt; [mapRecursiveResources](./clm-core.relationbdto.maprecursiveresources.md)

## RelationBDTO.mapRecursiveResources() method

Creates a map of the user-permissions

<b>Signature:</b>

```typescript
mapRecursiveResources(relation: RelationModel, roleNumber: number, userPermissions: {
        [key: string]: any;
    }, options?: PreFetchOptions): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  relation | [RelationModel](./clm-core.relationmodel.md) | The relation to create |
|  roleNumber | number | The role number of the user which |
|  userPermissions | { \[key: string\]: any; } | The permissions of the user |
|  options | [PreFetchOptions](./clm-core.prefetchoptions.md) | <i>(Optional)</i> The options |

<b>Returns:</b>

Promise&lt;void&gt;


