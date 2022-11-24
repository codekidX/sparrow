# Sparrow

|Status| Version | Download | Platforms |
|------|----------|---------|-----------|
| `Beta` | **0.1.1** | [Releases](https://github.com/codekidX/sparrow/releases) | Mac |

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
    "$pk": ["codekidX"],
    "$select": ["email", "mobile"]
}
```

1. `filter` your set where primary key is `codekidX`
2. `bins` lets you include the data corresponding to your `filter`

#### Debugging/Developing

> Currently you'll not be able to build and debug Sparrow on your system.
> There is a custom aerospike-client-rust fork with support for info command
> used in this app. The custom fork is not pushed upstream and want to maintain
> locally until it does.

```bash
yarn tauri dev
```