# Kanka-Wordcount
Takes the word count of all your campaigns, counting each object separately.

By default writes to standard output.

## Usage:
```ts
npx ts-node index.ts [OPTIONS] [-O all|characters,locations,notes,items,...]
```

## Configuration: 
Uses a .env file for the API key and API base.
Format:
API_KEY=[your api key here]
API_BASE=[preffered kanka.io API version's base url, 1.0: https://kanka.io/api/1.0/]

## Options:
    -h, --help              display this message
    -l, --list_length       length of the highest wordcount ranking, pass 0 to omit it, also works with negative numbers
    -n, --no_attributes     omit atrributes (age, gender, type, pronouns... + attributes tab)
    -o, --output            entries are also written to out.json in the working directory
    -O, --objects           specify objects to be included (default: all)
    -p, --parent            include parent object's name in the calculations
    -r, --reverse           display N lowest instead of N highest entries
    -q, --quiet             display nothing in terminal, to be used with -o
    -v, --verbose           ?????? not yet implemented