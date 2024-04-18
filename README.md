# 🕊️ sparrow: 

> a read only client for aerospike

|Status| Version | Download | Platforms |
|------|----------|---------|-----------|
| `Beta` | **0.1.3** | [Releases](https://github.com/codekidX/sparrow/releases) | Mac |

Sparrow is a minimal Aerospike client used to view data from your Aerospike
cluster. _**Sparrow does not have ability to write/update data yet.**_


### Sparrow Query

#### $pk

You can directly query for your primary key using the `$pk` query

```json
{
    "$pk": ["a", "b"]
}
```

`$pk` accepts list of primary keys and will only return data for the primary keys available in the set.

#### $eq

The `$eq` query uses filter expressions to query data for any secondary index. It **does not work on primary key** and fails if there is no secondary index on the key specified.

```json
{
    $eq: {
        name: "codekidx"
    }
}
```

#### $select

The `$select` selects only those bins which are provided in this query.

```json
{
    $pk: ["a"],
    $select: ["name", "age"]
}
```
this only returns bins `name` and `age` instead of returning all bins. The `$select` can also be used with `$eq` query.

#### Debugging/Developing

> Currently you'll not be able to build and debug Sparrow on your system.
> There is a custom aerospike-client-rust fork with support for info command
> used in this app. The custom fork is not pushed upstream and want to maintain
> locally until it does.

```bash
yarn tauri dev
```