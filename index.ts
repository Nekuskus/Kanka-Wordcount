require('dotenv').config()
import fetch from "node-fetch";

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
        if(character.name) wordcount += character.name.split(' ').length
        if(character.entry_parsed) {
            character.entry_parsed = character.entry_parsed.replace(/<[^>]+>/g, '');
            wordcount += character.entry_parsed.split(' ').length
        }
        if(character.posts) {
            for(var post of character.posts) {
                if(post.name) wordcount += post.name.split(' ').length
                post.entry_parsed = post.entry_parsed.replace(/<[^>]+>/g, '');
                wordcount += post.entry_parsed.split(' ').length
            }
        }
        if (character.title) wordcount += character.title.split(' ').length
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
        if(location.name) wordcount += location.name.split(' ').length
        if(location.entry_parsed) {
            location.entry_parsed = location.entry_parsed.replace(/<[^>]+>/g, '');
            wordcount += location.entry_parsed.split(' ').length
        }
        if (location.type) wordcount += location.type.split(' ').length
        if(location.posts) {
            for(var post of location.posts) {
                if(post.name) wordcount += post.name.split(' ').length
                post.entry_parsed = post.entry_parsed.replace(/<[^>]+>/g, '');
                wordcount += post.entry_parsed.split(' ').length
            }
        }
    }
    return wordcount
}
fetchCampaigns();