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
        console.log(campaign)
        console.log('calling')
        console.log(await fetchEntities(campaign['id']))
        console.log('call out')
    }
}

async function fetchEntities(id:Number) {
    console.log(id)
    const response = await fetch(process.env.API_BASE + `campaigns/${id}/characters` , {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + process.env.API_KEY
        }
    })
    const data = await response.json()
    for(var character of data.data) {
        if(character.entry) {
            character.entry = character.entry.replace(/<[^>]+>/g, '');
        }
    }
    return data
}

fetchCampaigns();