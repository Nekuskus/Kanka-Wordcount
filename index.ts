require('dotenv').config()
import { exit } from "node:process";
import { parseArgs } from "node:util";
const fs = require('fs');

const {
    values: { verbose, output, quiet, list_length, reverse, help, objects, no_attributes, parent }
} = parseArgs({
    options: {
        verbose: { //TODO
            type: "boolean",
            short: "v",
        },
        output: { //TODO
            type: "boolean",
            short: "o",
        },
        quiet: { //IMPLEMENTED
            type: "boolean",
            short: "q",
        },
        list_length: { //IMPLEMENTED
            type: "string",
            short: "l",
            default: "10",
        },
        reverse: { //IMPLEMENTED
            type: "boolean",
            short: "r",
        },
        help: { //IMPLEMENTED
            type: "boolean",
            short: "h",
        },
        objects: { //TODO, values: 'all'|example:'characters,notes,loactions,'
            type: "string",
            short: "O",
            default: "all"
        },
        no_attributes: { //TODO, don't count attributes if true (name, type, pronouns... + the attributes tab)
            type: 'boolean',
            short: 'n'
        },
        parent: {
            type: 'boolean',
            short: 'p'
        }
    }
})

function log(str: any) {
    if (!quiet) console.log(str)
}


function v_log(str: any) { //verbose log
    if (verbose) console.log(str)
}

if (help) {
    var helptext: string = `usage: npx ts-node index.ts [OPTIONS] [-l N] [-O all|characters,locations,notes,items,...]
    Takes the word count of all your campaigns, counting each object separately.
    
    By default writes to standard output.
    
    Uses a .env file for the API key and API base.
    Format:
    API_KEY=[your api key here]
    API_BASE=[preffered kanka.io API version's base url, 1.0: https://kanka.io/api/1.0/]
    
    Options:
        -h, --help              display this message
        -l, --list_length       length of the highest wordcount ranking, pass 0 to omit it, also works with negative numbers (default: 10)
        -n, --no_attributes     omit atrributes (age, gender, type, pronouns... + attributes tab)
        -o, --output            entries are also written to out.json in the working directory
        -O, --objects           specify objects to be included (default: all)
        -p, --parent            include parent object's name in the calculations
        -r, --reverse           display N lowest instead of N highest entries
        -q, --quiet             display nothing in terminal, to be used with -o
        -v, --verbose           writes api calls to standard output with time tak   en
    `
    log(helptext)
    exit()
}

class Score {
    name: string = ""
    wc: number = 0
    constructor(_name: string, _wc: number) {
        this.name = _name;
        this.wc = _wc;
    }
}

var highest: Array<Score> = []
var ranking_len: number = parseInt(list_length)
function placeInRanking(score: Score) {
    var i: number = 0
    var stop: boolean = false
    while (/*i < ranking_len &&*/ !stop) {
        if (!highest[i]) {
            highest[i] = score
            stop = true
        } else {
            if ((highest[i].wc < score.wc && !reverse) || (highest[i].wc > score.wc && reverse)) {
                highest.splice(i, 0, score)
                //if(highest.length > ranking_len) {
                //highest.splice(ranking_len, highest.length - ranking_len)
                //}
                stop = true
            }
        }
        i += 1
    }
}

async function fetchCampaigns() {
    const response = await fetch(process.env.API_BASE + 'campaigns', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const { data, error } = await response.json()
    //log(data)
    for (var campaign of data) {
        //log(campaign)
        log(`======Campaign: ${campaign['name']} (${campaign['id']})======`)
        let charWC: number = await fetchCharacters(campaign['id'])
        log(`Character word count: ${charWC}`)
        let locaWC: number = await fetchLocations(campaign['id'])
        log(`Location word count: ${locaWC}`)
        let abilWC:number = await fetchAbilities(campaign['id'])
        log(`Abitilies word count: ${abilWC}`)
        let orgsWC:number = await fetchOrganisations(campaign['id'])
        log(`Organisations word count: ${orgsWC}`)
        let itemWC:number = await fetchItems(campaign['id'])
        log(`Items word count: ${itemWC}`)
        let famiWC:number = await fetchFamilies(campaign['id'])
        log(`Families word count: ${famiWC}`)
        log(`Total word count: ${charWC + locaWC + abilWC + orgsWC + itemWC + famiWC}`)
        if(list_length) {
            if (ranking_len != 0) {
                log(`${!reverse && ranking_len > 0 ? 'Highest' : 'Lowest'} wordcount entries:`)
                highest.slice(...(ranking_len > 0 ? [0, ranking_len] : [ranking_len])).forEach((el, idx) => {
                    log(`${ranking_len > 0 ? idx + 1 : highest.length + (-ranking_len < highest.length ? ranking_len : -highest.length) + idx + 1}. ${el.name}: ${el.wc}`)
                });
            }
        }
    }
}

async function fetchCharacters(id: Number) {
    v_log(`Querying page 1 of characters... (url: ${process.env.API_BASE + `campaigns/${id}/characters?related=1`})`)
    var response = await fetch(process.env.API_BASE + `campaigns/${id}/characters?related=1`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    var data = await response.json()
    var new_data = null
    //fs.writeFileSync('out.json', JSON.stringify(data), { flag: 'a' })
    let wordcount: number = 0;
    do {
        if(new_data) {
            data = new_data
        }
        for (var character of data.data) {
            //console.log(character.name)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            var title_wc = 0
            if (character.name) name_wc = character.name.split(' ').length
            if (character.title) title_wc = character.title.split(' ').length
            if (character.entry) {
                character.entry_sanitized = character.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc = character.entry_sanitized.split(' ').length
            }
            if (character.posts) {
                for (var post of character.posts) {
                    if (post.name) {
                        name_wc += post.name.split(' ').length
                    }
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc + title_wc
            wordcount += total_wc
            placeInRanking(new Score("(character)   " + character.name, total_wc))
        }
        if(data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of characters... (url: ${data.links.next + '&related=1'})`)
            const new_response = await fetch(data.links.next + '&related=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + process.env.API_KEY
                }
            })
            new_data = await new_response.json()
        }
    } while (data.links.next != null)
    return wordcount
}

async function fetchLocations(id: Number) {
    //log(id)
    v_log(`Querying page 1 of locations... (url: ${process.env.API_BASE + `campaigns/${id}/locations?related=1`})`)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/locations?related=1`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    var data = await response.json()
    var new_data = null
    //fs.writeFileSync('out.json', JSON.stringify(data), { flag: 'a' })
    let wordcount: number = 0;
    do {
        if(new_data) {
            data = new_data
        }
        for (var location of data.data) {
            //console.log(location.name)
            //log(location)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            var type_wc = 0
            if (location.name) name_wc += location.name.split(' ').length
            if (location.entry) {
                location.entry_sanitized = location.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc += location.entry_sanitized.split(' ').length
            }
            if (location.type) type_wc += location.type.split(' ').length
            if (location.posts) {
                for (var post of location.posts) {
                    if (post.name) name_wc += post.name.split(' ').length
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc + type_wc
            wordcount += total_wc
            placeInRanking(new Score("(location)    " + location.name, total_wc))
        }
        if(data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of locations... (url: ${data.links.next + '&related=1'})`)
            const new_response = await fetch(data.links.next + '&related=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + process.env.API_KEY
                }
            })
            new_data = await new_response.json()
        }
        //v_log(JSON.parse(JSON.stringify(data.links)))
    } while (data.links.next != null);
    return wordcount
}
async function fetchAbilities(id: Number) {
    //log(id)
    v_log(`Querying page 1 of abilities... (url: ${process.env.API_BASE + `campaigns/${id}/abilities?related=1`})`)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/abilities?related=1`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    var data = await response.json()
    var new_data = null
    //fs.writeFileSync('out.json', JSON.stringify(data), { flag: 'a' })
    let wordcount: number = 0;
    do {
        if(new_data) {
            data = new_data
        }
        for (var ability of data.data) {
            //console.log(location.name)
            //log(location)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            var type_wc = 0
            if (ability.name) name_wc += ability.name.split(' ').length
            if (ability.entry) {
                ability.entry_sanitized = ability.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc += ability.entry_sanitized.split(' ').length
            }
            if (ability.type) type_wc += ability.type.split(' ').length
            if (ability.posts) {
                for (var post of ability.posts) {
                    if (post.name) name_wc += post.name.split(' ').length
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc + type_wc
            wordcount += total_wc
            placeInRanking(new Score("(ability)     " + ability.name, total_wc))
        }
        if(data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of abilities... (url: ${data.links.next + '&related=1'})`)
            const new_response = await fetch(data.links.next + '&related=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + process.env.API_KEY
                }
            })
            new_data = await new_response.json()
        }
    } while (data.links.next != null);
    return wordcount
}
async function fetchItems(id: Number) {
    //log(id)
    v_log(`Querying page 1 of items... (url: ${process.env.API_BASE + `campaigns/${id}/items?related=1`})`)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/items?related=1`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    var data = await response.json()
    var new_data = null
    //fs.writeFileSync('out.json', JSON.stringify(data), { flag: 'a' })
    let wordcount: number = 0;
    do {
        if(new_data) {
            data = new_data
        }
        for (var item of data.data) {
            //console.log(location.name)
            //log(location)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            var type_wc = 0
            var price_wc = 0
            var size_wc = 0
            if (item.name) name_wc += item.name.split(' ').length
            if (item.entry) {
                item.entry_sanitized = item.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc += item.entry_sanitized.split(' ').length
            }
            if (item.type) type_wc += item.type.split(' ').length
            if (item.posts) {
                for (var post of item.posts) {
                    if (post.name) name_wc += post.name.split(' ').length
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            if(item.price) price_wc += item.price.split(' ').length
            if(item.size) size_wc += item.size.split(' ').length
            var total_wc = name_wc + entry_wc + post_wc + type_wc + price_wc + size_wc
            wordcount += total_wc
            placeInRanking(new Score("(item)        " + item.name, total_wc))
        }
        if(data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of items... (url: ${data.links.next + '&related=1'})`)
            const new_response = await fetch(data.links.next + '&related=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + process.env.API_KEY
                }
            })
            new_data = await new_response.json()
        }
    } while (data.links.next != null);
    return wordcount
}
async function fetchOrganisations(id: Number) {
    //log(id)
    v_log(`Querying page 1 of organisations... (url: ${process.env.API_BASE + `campaigns/${id}/organisations?related=1`})`)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/organisations?related=1`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    var data = await response.json()
    var new_data = null
    //fs.writeFileSync('out.json', JSON.stringify(data), { flag: 'a' })
    let wordcount: number = 0;
    do {
        if(new_data) {
            data = new_data
        }
        for (var organisation of data.data) {
            //console.log(location.name)
            //log(location)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            var type_wc = 0
            var members_wc = 0
            if (organisation.name) name_wc += organisation.name.split(' ').length
            if (organisation.entry) {
                organisation.entry_sanitized = organisation.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc += organisation.entry_sanitized.split(' ').length
            }
            if (organisation.type) type_wc += organisation.type.split(' ').length
            if (organisation.posts) {
                for (var post of organisation.posts) {
                    if (post.name) name_wc += post.name.split(' ').length
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            if(organisation.members) {
                for(var member of organisation.members) {
                    if(member.role) members_wc += member.role.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc + type_wc + members_wc
            wordcount += total_wc
            placeInRanking(new Score("(organisation)" + organisation.name, total_wc))
        }
        if(data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of organisations... (url: ${data.links.next + '&related=1'})`)
            const new_response = await fetch(data.links.next + '&related=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + process.env.API_KEY
                }
            })
            new_data = await new_response.json()
        }
    } while (data.links.next != null);
    return wordcount
}
async function fetchFamilies(id: Number) {
    //log(id)
    v_log(`Querying page 1 of families... (url: ${process.env.API_BASE + `campaigns/${id}/families?related=1`})`)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/families?related=1`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    var data = await response.json()
    var new_data = null
    //fs.writeFileSync('out.json', JSON.stringify(data), { flag: 'a' })
    let wordcount: number = 0;
    do {
        if(new_data) {
            data = new_data
        }
        for (var family of data.data) {
            //console.log(location.name)
            //log(location)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            var type_wc = 0
            if (family.name) name_wc += family.name.split(' ').length
            if (family.entry) {
                family.entry_sanitized = family.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc += family.entry_sanitized.split(' ').length
            }
            if (family.type) type_wc += family.type.split(' ').length
            if (family.posts) {
                for (var post of family.posts) {
                    if (post.name) name_wc += post.name.split(' ').length
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc + type_wc
            wordcount += total_wc
            placeInRanking(new Score("(family)      " + family.name, total_wc))
        }
        if(data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of families... (url: ${data.links.next + '&related=1'})`)
            const new_response = await fetch(data.links.next + '&related=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + process.env.API_KEY
                }
            })
            new_data = await new_response.json()
        }
    } while (data.links.next != null);
    return wordcount
}
fetchCampaigns();
