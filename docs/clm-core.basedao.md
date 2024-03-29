<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [clm-core](./clm-core.md) &gt; [BaseDAO](./clm-core.basedao.md)

## BaseDAO class

DAO which exposes all CRUD opeartions

<b>Signature:</b>

```typescript
export default class BaseDAO<Datamodel extends BaseDatamodel> implements AdapterInterface<Datamodel> 
```
<b>Implements:</b> [AdapterInterface](./clm-core.adapterinterface.md)<!-- -->&lt;Datamodel&gt;

## Remarks

This class is based on Java DAO. see https://www.baeldung.com/java-dao-pattern. All classes with custom datamodels have to extend this class.

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(tableName, C)](./clm-core.basedao._constructor_.md) |  | Constructs a new instance of the <code>BaseDAO</code> class |
|  [(constructor)(adapter)](./clm-core.basedao._constructor__1.md) |  | Constructs a new instance of the <code>BaseDAO</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [adapter](./clm-core.basedao.adapter.md) |  | [AdapterInterface](./clm-core.adapterinterface.md)<!-- -->&lt;Datamodel&gt; | Database-specific adapter |
|  [isInitialized](./clm-core.basedao.isinitialized.md) |  | boolean |  |
|  [tableName](./clm-core.basedao.tablename.md) |  | string | The namespace of where the documents should be saved. In MariaDB the documents are persistet in tables. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [bulkDelete(payload)](./clm-core.basedao.bulkdelete.md) |  | Bulk deletes documents from the database |
|  [bulkInsert(payload)](./clm-core.basedao.bulkinsert.md) |  | Bulk inserts documents into the database |
|  [bulkUpdate(payload)](./clm-core.basedao.bulkupdate.md) |  | Bulk updates documents from the database |
|  [deleteById(id)](./clm-core.basedao.deletebyid.md) |  | Deletes document by id |
|  [findAll(options)](./clm-core.basedao.findall.md) |  | Find all the documents from the database |
|  [findByAttributes(searchObject)](./clm-core.basedao.findbyattributes.md) |  | Finds document bt attributes |
|  [findById(id, options)](./clm-core.basedao.findbyid.md) |  | Finds the document by id |
|  [init()](./clm-core.basedao.init.md) |  | Database specific instructions to be executed before the adapter can be used. For example creating the table with respective tablename in the database. The param  must be set to true after the init function is executed. |
|  [insert(payload, options)](./clm-core.basedao.insert.md) |  | Insert a document into the database |
|  [updateById(id, payload)](./clm-core.basedao.updatebyid.md) |  | Updates document by id |

