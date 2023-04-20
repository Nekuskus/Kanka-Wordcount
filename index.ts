require('dotenv').config()
//import fetch from "node-fetch"; 
//const { fetch } = require('node-fetch')
import { parseArgs } from "node:util";

const {
	values: { verbose, output, quiet, list_length, reverse }
} = parseArgs({
	options: {
		verbose: {
			type: "boolean",
			short: "v",
		},
		output: {
			type: "boolean",
			short: "o",
		},
		quiet: {
			type: "boolean",
			short: "q",
		},
		list_length: {
			type: "string",
			short: "l",
			default: "10",
		},
		reverse: {
			type: "boolean",
			short: "r",
		}
	}
})

class Score {
    name:string = ""
    wc:number = 0
    constructor(_name: string, _wc: number) {
        this.name = _name;
        this.wc = _wc;
    }
}

var highest:Array<Score> = []
var ranking_len:number = parseInt(list_length)
function placeInRanking(score:Score) {
    var i:number = 0
    var stop:boolean = false
    while(i < ranking_len && !stop) {
        if(!highest[i]) {
            highest[i] = score
            stop = true
        } else {
            if(highest[i].wc < score.wc) {
                highest.splice(i, 0, score)
                if(highest.length > ranking_len) {
                    highest.splice(ranking_len, highest.length - ranking_len)
                }
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
    const {data, error} = await response.json()
    //console.log(data)
    for(var campaign of data) {
        //console.log(campaign)
        console.log(`======Campaign: ${campaign['name']} (${campaign['id']})======`)
        let charWC:number = await fetchCharacters(campaign['id'])
        console.log(`Character word count: ${charWC}`)
        let locaWC:number = await fetchLocations(campaign['id'])
        console.log(`Location word count: ${locaWC}`)
        let abilWC:number = await fetchAbilities(campaign['id'])
        console.log(`Abitilies word count: ${abilWC}`)
        let orgsWC:number = await fetchOrganisations(campaign['id'])
        console.log(`Organisations word count: ${orgsWC}`)
        let itemWC:number = await fetchItems(campaign['id'])
        console.log(`Items word count: ${itemWC}`)
        let famiWC:number = await fetchFamilies(campaign['id'])
        console.log(`Families word count: ${famiWC}`)
        //console.log('call out')
        console.log(`Total word count: ${charWC + locaWC + abilWC + orgsWC + itemWC + famiWC}`)
        console.log("Highest wordcount entries:")
        highest.forEach((el, idx) => {
            console.log(`${idx+1}. ${el.name}: ${el.wc}`)
        });
    }
}

async function fetchCharacters(id:Number) {
    //console.log(id)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/characters?related=1` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    let wordcount:number = 0;
    for(var character of data.data) {
        var name_wc = 0
        var entry_wc = 0
        var post_wc = 0
        var title_wc = 0
        if(character.name) name_wc = character.name.split(' ').length
        if(character.title) title_wc = character.title.split(' ').length
        if(character.entry) {
            character.entry_sanitized = character.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
            entry_wc = character.entry_sanitized.split(' ').length
        }
        if(character.posts) {
            for(var post of character.posts) {
                if(post.name) {
                    name_wc += post.name.split(' ').length
                }
                post.entry_sanitized = post.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
                post_wc += post.entry_sanitized.split(' ').length
            }
        }
        var total_wc = name_wc + entry_wc + post_wc + title_wc
        wordcount += total_wc
        placeInRanking(new Score("(character)   " + character.name, total_wc))
    }
    return wordcount
}

async function fetchLocations(id:Number) {
    //console.log(id)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/locations?related=1` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    let wordcount:number = 0;
    for(var location of data.data) {
        //console.log(location)
        var name_wc = 0
        var entry_wc = 0
        var post_wc = 0
        var type_wc = 0
	if(location.name) name_wc += location.name.split(' ').length
        if(location.entry) {
            location.entry_sanitized = location.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
            entry_wc += location.entry_sanitized.split(' ').length
        }
        if (location.type) type_wc += location.type.split(' ').length
        if(location.posts) {
            for(var post of location.posts) {
                if(post.name) name_wc += post.name.split(' ').length
                post.entry_sanitized = post.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
                post_wc += post.entry_sanitized.split(' ').length
            }
        }
	var total_wc = name_wc + entry_wc + post_wc + type_wc
        wordcount += total_wc
        placeInRanking(new Score("(location)    " + location.name, total_wc))
    }
    return wordcount
}
async function fetchAbilities(id:Number) {
	//console.log(id)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/abilities?related=1` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    let wordcount:number = 0;
    for(var location of data.data) {
        //console.log(location)
        var name_wc = 0
        var entry_wc = 0
        var post_wc = 0
        var type_wc = 0
	if(location.name) name_wc += location.name.split(' ').length
        if(location.entry) {
            location.entry_sanitized = location.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
            entry_wc += location.entry_sanitized.split(' ').length
        }
        if (location.type) type_wc += location.type.split(' ').length
        if(location.posts) {
            for(var post of location.posts) {
                if(post.name) name_wc += post.name.split(' ').length
                post.entry_sanitized = post.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
                post_wc += post.entry_sanitized.split(' ').length
            }
        }
	var total_wc = name_wc + entry_wc + post_wc + type_wc
        wordcount += total_wc
        placeInRanking(new Score("(ability)     " + location.name, total_wc))
    }
    return wordcount
}
async function fetchItems(id:Number) {
    //console.log(id)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/items?related=1` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    let wordcount:number = 0;
    for(var location of data.data) {
        //console.log(location)
        var name_wc = 0
        var entry_wc = 0
        var post_wc = 0
        var type_wc = 0
	if(location.name) name_wc += location.name.split(' ').length
        if(location.entry) {
            location.entry_sanitized = location.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
            entry_wc += location.entry_sanitized.split(' ').length
        }
        if (location.type) type_wc += location.type.split(' ').length
        if(location.posts) {
            for(var post of location.posts) {
                if(post.name) name_wc += post.name.split(' ').length
                post.entry_sanitized = post.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
                post_wc += post.entry_sanitized.split(' ').length
            }
        }
	var total_wc = name_wc + entry_wc + post_wc + type_wc
        wordcount += total_wc
        placeInRanking(new Score("(item)        " + location.name, total_wc))
    }
    return wordcount
    
}
async function fetchOrganisations(id:Number) {
    //console.log(id)
	const response = await fetch(process.env.API_BASE + `campaigns/${id}/organisations?related=1` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    let wordcount:number = 0;
    for(var location of data.data) {
        //console.log(location)
        var name_wc = 0
        var entry_wc = 0
        var post_wc = 0
        var type_wc = 0
	if(location.name) name_wc += location.name.split(' ').length
        if(location.entry) {
            location.entry_sanitized = location.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
            entry_wc += location.entry_sanitized.split(' ').length
        }
        if (location.type) type_wc += location.type.split(' ').length
        if(location.posts) {
            for(var post of location.posts) {
                if(post.name) name_wc += post.name.split(' ').length
                post.entry_sanitized = post.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
                post_wc += post.entry_sanitized.split(' ').length
            }
        }
	var total_wc = name_wc + entry_wc + post_wc + type_wc
        wordcount += total_wc
        placeInRanking(new Score("(organisation) " + location.name, total_wc))
    }
    return wordcount
    
}
async function fetchFamilies(id:Number) {
    //console.log(id)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/families?related=1` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    let wordcount:number = 0;
    for(var location of data.data) {
        //console.log(location)
        var name_wc = 0
        var entry_wc = 0
        var post_wc = 0
        var type_wc = 0
	if(location.name) name_wc += location.name.split(' ').length
        if(location.entry) {
            location.entry_sanitized = location.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
            entry_wc += location.entry_sanitized.split(' ').length
        }
        if (location.type) type_wc += location.type.split(' ').length
        if(location.posts) {
            for(var post of location.posts) {
                if(post.name) name_wc += post.name.split(' ').length
                post.entry_sanitized = post.entry.replace(/<br>/g,'\n').replace(/<[^>]+>/g, '');
                post_wc += post.entry_sanitized.split(' ').length
            }
  	}
	var total_wc = name_wc + entry_wc + post_wc + type_wc
        wordcount += total_wc
        placeInRanking(new Score("(family)      " + location.name, total_wc))
    }
    return wordcount
    
}
fetchCampaigns();
