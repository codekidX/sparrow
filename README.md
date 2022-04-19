# 🦅 Sparrow

|Status|
|------|
| ☠️ `Alpha` |

Sparrow is a minimal Aerospike client used to view data from your Aerospike
cluster. Sparrow does not have ability to write/update data yet. 


### Sparrow Query

Due to the lack of proper pre-approving AQL query in engine, Sparrow implements
a simple schema for querying the `RecordSet`. This schema is then 
- analyzed
- validated
- converted

into respective FilterExpression and Statement.

```json
{
    "filter": {
        "user": "Ashish",
        "id": 1
    },
    "pk": 1,
    "filter_or": {
        "a": 1,
        "b": 2
    }
}
```

1. `filter` your set `where user = "Ashish" AND id = 1`
2. get record `where pk = 1`
3. `filter` your set `where a = 1 OR b = 2`

Sparrow Query is Experimental and may have performance issues.

#### Debugging

> Currently you'll not be able to build and debug Sparrow on your system.
> There is a custom aerospike-client-rust fork with support for info command
> used in this app. The custom fork is not pushed upstream and want to maintain
> locally until it does.

```bash
yarn tauri dev
```