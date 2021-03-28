let fs = require("fs")
let path = require("path")
let cheerio = require("cheerio")
let request = require("request")

let matchLinks = [];

let url = "https://www.espncricinfo.com/series/ipl-2020-21-1210595/match-results";

request(url, function cb(err, response, html) {
    if (err) {
        console.log(err)
    } else {
        getMatches(html);
    }
})

function getMatches(html) {
    let selectorTool = cheerio.load(html);
    let matches = selectorTool("a[data-hover='Scorecard']");

    for (let i = 0; i < matches.length; i++) {
        let link = ("https://www.espncricinfo.com" + selectorTool(matches[i]).attr("href"));

        matchLinks.push(link);
    }
    for (let i = 0; i < matchLinks.length; i++) {
        getTeams(matchLinks[i]);
    }
}
function getTeams(html) {
    request(html, function cb(err, response, html) {
        if (err) {
            console.log(err)
        } else {
            getTeamNamesAndPlayerNames(html);
        }
    })

}

function getTeamNamesAndPlayerNames(html) {
    let selectorTool = cheerio.load(html);

    let teams = selectorTool(".Collapsible h5")
    let batsmanTable = selectorTool(".table.batsman");

    for (let i = 0; i < teams.length; i++) {

        let team = selectorTool(teams[i]).text().split("INNINGS")[0].trim();
        createTeamFolder(team);

        let playerData = selectorTool(batsmanTable[i]).find("tbody tr");
        for (let j = 0; j < playerData.length; j += 2) {
            let row = selectorTool(playerData[j]).find("td");
            //data  
            let name = selectorTool(row[0]).text().trim();
            let runs = selectorTool(row[2]).text().trim();
            let fours = selectorTool(row[5]).text().trim();
            let sixes = selectorTool(row[6]).text().trim();
            let opponentTeam;

            if (i = 0) {
                opponentTeam = selectorTool(teams[i]).text().split("INNINGS")[0];
            } else if (i = 1) {
                opponentTeam = selectorTool(teams[i]).text().split("INNINGS")[0];
            }

            let playerStats = []
            playerStats.push({
                "Run": runs,
                "Four": fours,
                "Six": sixes,
                "Opponent": opponentTeam
            })
            //console.log("player", name,"team", team, "opponent team", opponentTeam)
            createPlayerFile(team, name, playerStats);
        }

    }
}


function createTeamFolder(teamName) {
    let pathOfTeamFolder = path.join(__dirname, teamName);

    if (fs.existsSync(pathOfTeamFolder) == false) {
        fs.mkdirSync(pathOfTeamFolder)
    }
}
function createPlayerFile(teamName, playerName, playerStats) {
    let pathOfPlayerFile = path.join(__dirname, teamName, playerName + ".json");

    if (fs.existsSync(pathOfPlayerFile) == false) {
        let createFile = fs.createWriteStream(pathOfPlayerFile);
        createFile.end();
        fs.writeFileSync(pathOfPlayerFile, JSON.stringify(playerStats));
    }else if(fs.existsSync(pathOfPlayerFile)== true){
        let olddata = fs.readFileSync(pathOfPlayerFile);

        if(olddata != ""){
            olddata = JSON.parse(olddata)
            olddata.push(playerStats)
            fs.writeFileSync(pathOfPlayerFile, JSON.stringify(olddata))
        }
    }
}
