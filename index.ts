require('dotenv').config()
//import fetch from "node-fetch"; 
//const { fetch } = require('node-fetch')

class Score {
    name:string = ""
    wc:number = 0
    constructor(_name: string, _wc: number) {
        this.name = _name;
        this.wc = _wc;
    }
}

var highest:Array<Score> = []

function placeInRanking(score:Score) {
    var i:number = 0
    var stop:boolean = false
    while(i < 10 && !stop) {
        if(!highest[i]) {
            highest[i] = score
            stop = true
        } else {
            if(highest[i].wc < score.wc) {
                highest.splice(i, 0, score)
                if(highest.length > 10) {
                    highest.splice(10, highest.length - 10)
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
        //console.log('call out')
        console.log(`Total word count: ${charWC + locaWC}`)
        console.log("Highest wordcount entries:")
        highest.forEach(el => {
            console.log(`${el.name}: ${el.wc}`)
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
        placeInRanking(new Score("(character) " + character.name, total_wc))
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
        placeInRanking(new Score("(location)  " + location.name, total_wc))
    }
    return wordcount
}
function fetchAbilities() {

}
function fetchItems() {
    
}
function fetchOrganisations() {
    
}
fetchCampaigns();
