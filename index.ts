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
        parent: { //TODO
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
        -n, --no_attributes     (TODO) omit atrributes (age, gender, type, pronouns... + attributes tab)
        -o, --output            (TODO) entries are also written to out.json in the working directory
        -O, --objects           (TODO) specify objects to be included (default: all)
        -p, --parent            (TODO) include parent object's name in the calculations
        -r, --reverse           display N lowest instead of N highest entries
        -q, --quiet             display nothing in terminal, to be used with -o
        -v, --verbose           (TODO: time) writes api calls to standard output with time taken
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
    var i: number = 0
    for (var campaign of data) {
        if(i > 0) log('')
        //log(campaign)
        log(`======Campaign: ${campaign['name']} (${campaign['id']})======`)
        let charWC: number = await fetchCharacters(campaign['id'])
        log(`Character word count: ${charWC}`)
        let locaWC: number = await fetchLocations(campaign['id'])
        log(`Location word count: ${locaWC}`)
        let abilWC: number = await fetchAbilities(campaign['id'])
        log(`Abitilies word count: ${abilWC}`)
        let orgsWC: number = await fetchOrganisations(campaign['id'])
        log(`Organisations word count: ${orgsWC}`)
        let itemWC: number = await fetchItems(campaign['id'])
        log(`Items word count: ${itemWC}`)
        let famiWC: number = await fetchFamilies(campaign['id'])
        log(`Families word count: ${famiWC}`)
        let noteWC: number = await fetchNotes(campaign['id'])
        log(`Notes word count: ${noteWC}`)
        let evntWC: number = await fetchEvents(campaign['id'])
        log(`Events word count: ${evntWC}`)
        let quesWC: number = await fetchQuests(campaign['id'])
        log(`Quests word count: ${quesWC}`)
        let caleWC: number = await fetchCalendars(campaign['id'])
        log(`Calendars word count: ${caleWC}`)
        log('')
        log(`Total word count: ${charWC + locaWC + abilWC + orgsWC + itemWC + famiWC + noteWC + evntWC + quesWC + caleWC}`)
        log(`Total object count: ${highest.length}`)
        if (list_length) {
            if (ranking_len != 0) {
                log(`${!reverse && ranking_len > 0 ? 'Highest' : 'Lowest'} wordcount entries:`)
                highest.slice(...(ranking_len > 0 ? [0, ranking_len] : [ranking_len])).forEach((el, idx) => {
                    log(`${ranking_len > 0 ? idx + 1 : highest.length + (-ranking_len < highest.length ? ranking_len : -highest.length) + idx + 1}. ${el.name}: ${el.wc}`)
                });
            }
        }
        i+= 1;
        highest = []
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
        if (new_data) {
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
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
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
        if (new_data) {
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
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
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
        if (new_data) {
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
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
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
        if (new_data) {
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
            if (item.price) price_wc += item.price.split(' ').length
            if (item.size) size_wc += item.size.split(' ').length
            var total_wc = name_wc + entry_wc + post_wc + type_wc + price_wc + size_wc
            wordcount += total_wc
            placeInRanking(new Score("(item)        " + item.name, total_wc))
        }
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
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
        if (new_data) {
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
            if (organisation.members) {
                for (var member of organisation.members) {
                    if (member.role) members_wc += member.role.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc + type_wc + members_wc
            wordcount += total_wc
            placeInRanking(new Score("(organisation)" + organisation.name, total_wc))
        }
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
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
        if (new_data) {
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
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
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
async function fetchNotes(id: Number) {
    //log(id)
    v_log(`Querying page 1 of notes... (url: ${process.env.API_BASE + `campaigns/${id}/notes?related=1`})`)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/notes?related=1`, {
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
        if (new_data) {
            data = new_data
        }
        for (var note of data.data) {
            //console.log(location.name)
            //log(location)
            var name_wc = 0
            var entry_wc = 0
            var type_wc = 0
            if (note.name) name_wc += note.name.split(' ').length
            if (note.entry) {
                note.entry_sanitized = note.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc += note.entry_sanitized.split(' ').length
            }
            if (note.type) type_wc += note.type.split(' ').length
            var total_wc = name_wc + entry_wc + type_wc
            wordcount += total_wc
            placeInRanking(new Score("(note)        " + note.name, total_wc))
        }
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of notes... (url: ${data.links.next + '&related=1'})`)
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

async function fetchEvents(id: Number) {
    v_log(`Querying page 1 of events... (url: ${process.env.API_BASE + `campaigns/${id}/events?related=1`})`)
    var response = await fetch(process.env.API_BASE + `campaigns/${id}/events?related=1`, {
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
        if (new_data) {
            data = new_data
        }
        for (var event of data.data) {
            //console.log(event.name)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            if (event.name) name_wc = event.name.split(' ').length
            if (event.entry) {
                event.entry_sanitized = event.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc = event.entry_sanitized.split(' ').length
            }
            if (event.posts) {
                for (var post of event.posts) {
                    if (post.name) {
                        name_wc += post.name.split(' ').length
                    }
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc
            wordcount += total_wc
            placeInRanking(new Score("(event)       " + event.name, total_wc))
        }
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of events... (url: ${data.links.next + '&related=1'})`)
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

async function fetchQuests(id: Number) {
    v_log(`Querying page 1 of quests... (url: ${process.env.API_BASE + `campaigns/${id}/quests?related=1`})`)
    var response = await fetch(process.env.API_BASE + `campaigns/${id}/quests?related=1`, {
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
        if (new_data) {
            data = new_data
        }
        for (var quest of data.data) {
            //console.log(quest.name)
            var name_wc = 0
            var entry_wc = 0
            var post_wc = 0
            if (quest.name) name_wc = quest.name.split(' ').length
            if (quest.entry) {
                quest.entry_sanitized = quest.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc = quest.entry_sanitized.split(' ').length
            }
            if (quest.posts) {
                for (var post of quest.posts) {
                    if (post.name) {
                        name_wc += post.name.split(' ').length
                    }
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    post_wc += post.entry_sanitized.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + post_wc
            wordcount += total_wc
            placeInRanking(new Score("(quest)       " + quest.name, total_wc))
        }
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of quests... (url: ${data.links.next + '&related=1'})`)
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

async function fetchCalendars(id: Number) {
    v_log(`Querying page 1 of calendars... (url: ${process.env.API_BASE + `campaigns/${id}/calendars?related=1`})`)
    var response = await fetch(process.env.API_BASE + `campaigns/${id}/calendars?related=1`, {
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
        if (new_data) {
            data = new_data
        }
        for (var calendar of data.data) {
            //console.log(calendar.name)
            var name_wc = 0
            var entry_wc = 0
            var posts_wc = 0 // Non-existent in the GUI, returned by api even though undocumente
            var months_wc = 0
            var moons_wc = 0
            var suffix_wc = 0
            var weekdays_wc = 0
            var seasons_wc = 0
            var years_wc = 0
            if (calendar.name) name_wc = calendar.name.split(' ').length
            if (calendar.entry) {
                calendar.entry_sanitized = calendar.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                entry_wc = calendar.entry_sanitized.split(' ').length
            }
            if (calendar.posts) {
                for (var post of calendar.posts) {
                    if (post.name) {
                        name_wc += post.name.split(' ').length
                    }
                    post.entry_sanitized = post.entry.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
                    posts_wc += post.entry_sanitized.split(' ').length
                }
            }
            if (calendar.months) {
                for (var month of calendar.months) {
                    if (month.name) {
                        name_wc += month.name.split(' ').length
                    }
                    if (month.alias) {
                        name_wc += month.alias.split(' ').length
                    }
                }
            }
            if (calendar.weekdays) {
                for (var day of calendar.weekdays) {
                    name_wc += day.split(' ').length
                }
            }
            if(calendar.years) {
                for (var year in calendar.years) {
                    years_wc += year.split(' ').length
                    years_wc += calendar.years[year].split(' ').length
                }
            }
            if(calendar.suffix) suffix_wc += calendar.suffix.split(' ').length
            if(calendar.moons) {
                for (var moon of calendar.moons) {
                    moons_wc += moon.name.split(' ').length
                    moons_wc += moon.colour.split(' ').length
                }
            }
            if(calendar.seasons) {
                for (var season of calendar.seasons) {
                    seasons_wc += season.name.split(' ').length
                }
            }
            var total_wc = name_wc + entry_wc + posts_wc + months_wc + moons_wc + suffix_wc + weekdays_wc + seasons_wc + years_wc
            wordcount += total_wc
            placeInRanking(new Score("(calendar)    " + calendar.name, total_wc))
        }
        v_log(`Next is: ${data.links.next}`)
        if (data.links.next != null) {
            v_log(`Querying page ${data.links.next.substr(-1)} of calendars... (url: ${data.links.next + '&related=1'})`)
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



fetchCampaigns();
