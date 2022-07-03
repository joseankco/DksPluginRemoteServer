var endpoint_stream = "stream"
var websocket_stream = {};
var json = {}

var maxX = 20900;
var maxY = 13400;

var shipRatioSize = 300;
var npcRatioSize = 170;
var portalRatioSize = 100;
var playerRatioSize = 200;

var firstInit = false;

var colors = {
    portals: '#ffffff',
    allies: '#1dd7ee',
    enemies: '#ff1818',
    npcs: '#c90d0d',
    hero: '#48ed00'
}

function transformX(x) {
    const w = $('#map').get(0).width;
    return parseInt((x / json.map.boundX) * w)
}

function transformY(y) {
    const h = $('#map').get(0).height;
    return parseInt((y / json.map.boundY) * h)
}

var urlWebSocket = window.location.toString()
            .replace('/index.html', '/')
            .replace('http://', 'ws://')
            .replace('https://', 'wss://');
    
function closeWebSocket(socket) {
    if (socket['close'] != undefined) {
        socket.close();
    }  
}

function startStream() {
    var url = urlWebSocket + endpoint_stream;
    closeWebSocket(websocket_stream);
    initStreamWebSocket(url);
    $('#start').hide();
    $('#stop').show();
}

function stopStream() {
    closeWebSocket(websocket_stream);
    $('#start').show();
    $('#stop').hide();
}

function drawPoint(x, y, ctx, canvas, color, ratioSize) {
    const size = parseInt((canvas.width + canvas.height) / ratioSize)
    ctx.fillStyle = color;
    ctx.fillRect(transformX(x), transformY(y), size, size);
}

function getCircle(x, y, ctx, canvas, color, ratioSize) {
    const size = parseInt((canvas.width + canvas.height) / ratioSize)
    ctx.beginPath();
    ctx.arc(transformX(x), transformY(y), size, 0, 2 * Math.PI);
    return ctx;
}

function drawCircle(x, y, ctx, canvas, color, ratioSize) {
    const size = parseInt((canvas.width + canvas.height) / ratioSize)
    ctx.lineWidth = 8;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(transformX(x), transformY(y), size, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawCircleFill(x, y, ctx, canvas, color, ratioSize) {
    const size = parseInt((canvas.width + canvas.height) / ratioSize)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(transformX(x), transformY(y), size, 0, 2 * Math.PI);
    ctx.fill();
}

function clearMap(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderMap() {
    const canvas = $('#map').get(0);
    const context = canvas.getContext('2d');
    clearMap(canvas)
    const minimap = "https://darkorbit-22.bpsecure.com/spacemap/graphics/minimaps/minimap-" + json.map.mapID + "-700.jpg";
    $('#map').css('background', 'url(' + minimap + ')');
    $('#map').css('background-size', '100% 100%');
    json.map.portals.forEach(function(portal) {
        drawCircle(portal.x, portal.y, context, canvas, colors.portals, portalRatioSize);
    });
    json.map.npcs.forEach(function(npc) {
        drawPoint(npc.x, npc.y, context, canvas, colors.npcs, npcRatioSize);
    });
    json.map.players.forEach(function(player) {
        drawCircleFill(player.x, player.y, context, canvas, player.isEnemy ? colors.enemies : colors.allies, shipRatioSize);
    });
    drawCircleFill(json.hero.x, json.hero.y, context, canvas, colors.hero, playerRatioSize);
}

function renderMapOverlay() {
    $('#ping').text(json.stats.ping + 'ms');
    $('#mapName').text(json.map.name);
    $('#runningTime').text(json.stats.runningTime);
    $('#hull').text(parseInt(json.hero.hull).toLocaleString() + ' / ' + parseInt(json.hero.maxHull).toLocaleString())
    $('#hull').css('width', parseInt(json.hero.hullPercent * 100) + '%')
    if (parseInt(json.hero.hull) == 0) {
        $('#hullw').css('display', 'none')
    } else {
        $('#hullw').css('display', 'block')
    }
    $('#hp').text(parseInt(json.hero.hp).toLocaleString() + ' / ' + parseInt(json.hero.maxHp).toLocaleString())
    $('#hp').css('width', parseInt(json.hero.hpPercent * 100) + '%')
    $('#shield').text(parseInt(json.hero.shield).toLocaleString() + ' / ' + parseInt(json.hero.maxShield).toLocaleString())
    $('#shield').css('width', parseInt(json.hero.shieldPercent * 100) + '%')
    $('#status').text(json.module.status);

    if (json.hero.target.isValid) {
        $('#target').css('display', 'block')
        $('#targetName').text(json.hero.target.name)
        if (json.hero.target.isEnemy) {
            $('#targetName').css('color', colors.enemies)
        } else {
            $('#targetName').css('color', colors.allies)
        }
        $('#targetHp').text(parseInt(json.hero.target.hp).toLocaleString() + ' / ' + parseInt(json.hero.target.maxHp).toLocaleString())
        $('#targetHp').css('width', parseInt(json.hero.target.hpPercent * 100) + '%')
        $('#targetShield').text(parseInt(json.hero.target.shield).toLocaleString() + ' / ' + parseInt(json.hero.target.maxShield).toLocaleString())
        $('#targetShield').css('width', parseInt(json.hero.target.shieldPercent * 100) + '%')
    } else {
        $('#target').css('display', 'none')
    }
}

function renderNearby() {
    let ply = '';
    let np = '';
    json.map.players.forEach(function(player) {
        ply += player.name + '\n';
    });
    json.map.npcs.forEach(function(npc) {
        np += npc.name + '\n';
    });
    $('#nearbyPlayers').text(ply);
    $('#nearbyNpcs').text(np);
}

function renderDataTable() {
    $('#totalUridium').text(parseInt(json.stats.totalUridium).toLocaleString())
    $('#earnedUridium').text(parseInt(json.stats.earnedUridium).toLocaleString())
    $('#earnedHourUridium').text(parseInt(json.stats.earnedUridium / (json.stats.runningTimeSeconds / 3600)).toLocaleString())

    $('#totalExperience').text(parseInt(json.stats.totalExperience).toLocaleString())
    $('#earnedExperience').text(parseInt(json.stats.earnedExperience).toLocaleString())
    $('#earnedHourExperience').text(parseInt(json.stats.earnedExperience / (json.stats.runningTimeSeconds / 3600)).toLocaleString())

    $('#totalCredits').text(parseInt(json.stats.totalCredits).toLocaleString())
    $('#earnedCredits').text(parseInt(json.stats.earnedCredits).toLocaleString())
    $('#earnedHourCredits').text(parseInt(json.stats.earnedCredits / (json.stats.runningTimeSeconds / 3600)).toLocaleString())

    $('#totalHonor').text(parseInt(json.stats.totalHonor).toLocaleString())
    $('#earnedHonor').text(parseInt(json.stats.earnedHonor).toLocaleString())
    $('#earnedHourHonor').text(parseInt(json.stats.earnedHonor / (json.stats.runningTimeSeconds / 3600)).toLocaleString())
}

function initStreamWebSocket(urlWebSocket)
{
    $('#server').text(urlWebSocket);
    websocket_stream = {
        connect : function() {
            try {
                this._ws = new WebSocket(urlWebSocket);
                this._ws.onmessage = this._onmessage;
            } catch(exception) { }
        },
        
        close: function() {
            try {
                this._ws.close();
            } catch(exception) { }
        },
        
        _onmessage : function(m) {
            if (m.data) {
                // $('#timeWebSocket').text(m.data);
                json = JSON.parse(m.data);
                if (!firstInit) {
                    initMap();
                }
                renderMap();
                renderMapOverlay();
                renderDataTable();
                renderNearby();
            }
        },
    };

    websocket_stream.connect();
}

function initMap() {
    if (json?.map) {
        const canvas = $('#map').get(0);
        canvas.style.width = '100%';
        canvas.style.height ='auto';
        canvas.width = parseInt(json.map.boundX) / 10;
        canvas.height =  parseInt(json.map.boundY) / 10;
    }
}

$(function() {
    $('#stop').hide();
    $(window).resize(function() {
        initMap();
        renderMap();
    });
    $(window).scroll(function() {
        initMap();
        renderMap();
    });
})

