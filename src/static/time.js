var stats_endpoint = "stats"
var charts_endpoint = "charts"
var stats_websocket = {};
var charts_websocket = {};
var json = {}
var json_charts = {}

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

var rankChart = null;

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

function startStatsStream() {
    closeWebSocket(stats_websocket);
    closeWebSocket(charts_websocket);
    initStatsWebSocket(urlWebSocket + stats_endpoint);
    $('#start').hide();
    $('#stop').show();
}

function stopStatsStream() {
    closeWebSocket(stats_websocket);
    closeWebSocket(charts_websocket);
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
    $('#hull-desc').text(parseInt(json.hero.hull).toLocaleString() + ' / ' + parseInt(json.hero.maxHull).toLocaleString())
    $('#hull').css('width', parseInt(json.hero.hullPercent * 100) + '%')
    if (parseInt(json.hero.hull) == 0) {
        $('#hullw').css('display', 'none')
    } else {
        $('#hullw').css('display', '')
    }
    $('#hp-desc').text(parseInt(json.hero.hp).toLocaleString() + ' / ' + parseInt(json.hero.maxHp).toLocaleString())
    $('#hp').css('width', parseInt(json.hero.hpPercent * 100) + '%')
    $('#shield-desc').text(parseInt(json.hero.shield).toLocaleString() + ' / ' + parseInt(json.hero.maxShield).toLocaleString())
    $('#shield').css('width', parseInt(json.hero.shieldPercent * 100) + '%')
    $('#status').text(json.module.status);

    console.log
    if (json.hero.target.isValid) {
        $('#target').css('display', '')
        $('#targetName').text(json.hero.target.name)
        if (json.hero.target.isEnemy) {
            $('#targetName').css('color', colors.enemies)
        } else {
            $('#targetName').css('color', colors.allies)
        }
        $('#targetHp-desc').text(parseInt(json.hero.target.hp).toLocaleString() + ' / ' + parseInt(json.hero.target.maxHp).toLocaleString())
        $('#targetHp').css('width', parseInt(json.hero.target.hpPercent * 100) + '%')
        $('#targetShield-desc').text(parseInt(json.hero.target.shield).toLocaleString() + ' / ' + parseInt(json.hero.target.maxShield).toLocaleString())
        $('#targetShield').css('width', parseInt(json.hero.target.shieldPercent * 100) + '%')
    } else {
        $('#target').css('display', 'none')
    }
}

function renderLogScrapper() {
    if (!!json.plugin.logScrapper) {
        var patterns = json.plugin.logScrapper.patterns
        if (patterns?.length > 0) {
            $("#patternsTableBody").empty();
            patterns.forEach(function(pattern) {
                $("#patternsTableBody")
                    .append($('<tr>')
                        .append($('<td>')
                            .attr('scope', 'row')
                            .text(pattern.pattern)
                        )
                        .append($('<td>')
                            .text(pattern.occurrences)
                        )
                        .append($('<td>')
                            .text(pattern.occurrencesh)
                        )
                        .append($('<td>')
                            .text(pattern.total)
                        )
                        .append($('<td>')
                            .text(pattern.totalh)
                        )
                    )
            })
        }
    }
}

function renderPalladiumStats() {
    if (!!json.plugin.palladiumStats) {
        $('#pstats-status').text(json.plugin.palladiumStats.status)
        $('#pstats-running').text(json.plugin.palladiumStats.runningTime)
        $('#pstats-collected').text(json.plugin.palladiumStats.total)
        $('#pstats-collected-hour').text(json.plugin.palladiumStats.totalh)
        $('#pstats-ee-hour').text(json.plugin.palladiumStats.eeh)
    }
}

function renderLogsViewer() {
    if (!!json.plugin.liveLogs) {
        var stdLines = json.plugin.liveLogs.lastStdLogs
        if (stdLines?.length > 0) {
            var strStdLines = ''
            stdLines.forEach(function(line) {
                strStdLines = strStdLines + line + '\n'
            })
            $('#log-std-lines').text(strStdLines);
        }
        var errLines = json.plugin.liveLogs.lastErrLogs
        if (errLines?.length > 0) {
            var strErrLines = ''
            errLines.forEach(function(line) {
                strErrLines = strErrLines + line + '\n'
            })
            $('#log-err-lines').text(strErrLines);
        }
    }
}

function renderNearby() {
    let ply = '';
    let np = '';
    json.map.players.forEach(function(player) {
        ply += player.name + '\n';
    });
    var npcmap = new Map();
    var bigger = 1;
    json.map.npcs.forEach(function(npc) {
        npcm = npcmap.get(npc.name);
        if (!npcm) {
            npcmap.set(npc.name, 1);
        } else {
            var n = npcm + 1;
            npcmap.set(npc.name, n)
            if (n > bigger) {
                bigger = n;
            }
        }
        // np += npc.name + '\n';
    });
    npcmap.forEach(function(value, key) {
        var biggerstr = bigger.toString();
        if (value > 1) {
            var valuestr = value.toString();
            np += valuestr.padStart(biggerstr.length, ' ') + 'x ' + key + '\n'
        } else {
            if (bigger > 1) {
                np += ''.padStart(biggerstr.length + 2, ' ') + key + '\n'
            } else {
                np += key + '\n'
            }
        }
    });

    if (json.map.players.length === 0) {
        $('#nearbyPlayersTitle-sm').css('display', 'none')
        $('#nearbyPlayersTitle-md').css('display', 'none')
    } else {
        $('#nearbyPlayersTitle-sm').css('display', '')
        $('#nearbyPlayersTitle-md').css('display', '')
    }

    if (json.map.npcs.length === 0) {
        $('#nearbyNpcsTitle-sm').css('display', 'none')
        $('#nearbyNpcsTitle-md').css('display', 'none')
    } else {
        $('#nearbyNpcsTitle-sm').css('display', '')
        $('#nearbyNpcsTitle-md').css('display', '')
    }

    $('#nearbyPlayers-sm').text(ply);
    $('#nearbyNpcs-sm').text(np);
    $('#nearbyPlayers-md').text(ply);
    $('#nearbyNpcs-md').text(np);
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

function initStatsWebSocket(url)
{
    stats_websocket = {
        connect : function() {
            try {
                this._ws = new WebSocket(url);
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
                console.log('New Stats Message')
                if (!firstInit) {
                    initMap();
                }
                renderMap();
                renderMapOverlay();
                renderDataTable();
                renderNearby();
                renderLogScrapper();
                renderPalladiumStats();
                renderLogsViewer();
                renderRanksTable();
                renderHangarTable('#ammoLaserDataTableBody', json.hangarData?.items?.ammo_laser);
                renderHangarTable('#ammoRocketDataTableBody', json.hangarData?.items?.ammo_rockets);
                renderHangarTable('#resourcesDataTableBody', json.hangarData?.items?.resources);
                renderHangarTable('#oreDataTableBody', json.hangarData?.items?.ore);
                renderPalladiumHourChart();
                renderPalladiumTotalChart();
            }
        },
    };
    stats_websocket.connect();
}

function renderRanksTable() {
    URL = 'https://darkorbit-22.bpsecure.com/do_img/global/ranks/rank_'
    if (!!json.rankData && !!json.rankData.now) {
        $('#rankDataLastCheck').text(new Date(Math.round(json.rankData.now.tick)).toTimeString().split(' ')[0])
        $('#upperRankDesc').empty()
        $('#upperRankDesc').text(json.rankData.now.upper.name)
        $('#upperRankDesc').append($('<img>', {src: URL + json.rankData.now.upper.img}))
        $('#upperRankPoints').text(parseInt(json.rankData.now.upper.points).toLocaleString())
        $('#upperRankDiff').text(parseInt(json.rankData.diff.upper).toLocaleString())

        $('#currentRankDesc').empty()
        $('#currentRankDesc').text(json.rankData.now.current.name)
        $('#currentRankDesc').append($('<img>', {src: URL + json.rankData.now.current.img}))
        $('#currentRankPoints').text(parseInt(json.rankData.now.current.points).toLocaleString())
        $('#currentRankDiff').text(parseInt(json.rankData.diff.current).toLocaleString())

        $('#lowerRankDesc').empty()
        $('#lowerRankDesc').text(json.rankData.now.lower.name)
        $('#lowerRankDesc').append($('<img>', {src: URL + json.rankData.now.lower.img}))
        $('#lowerRankPoints').text(parseInt(json.rankData.now.lower.points).toLocaleString())
        $('#lowerRankDiff').text(parseInt(json.rankData.diff.lower).toLocaleString())
    }
}

function renderHangarTable(id, items) {
    if (!!json.hangarData && !!json.hangarData.diff) {
        $('#hangarDataLastCheck').text(new Date(json.hangarData.diff.tick).toTimeString().split(' ')[0])
        if (items?.length > 0) {
            $(id).empty();
            items.forEach(function(item) {
                var diff = json.hangarData.diff.differences.find(function(d) {
                    return d.lootId === item.loot_id;
                }).diff;
                $(id)
                    .append($('<tr>')
                        .append($('<td>')
                            .attr('scope', 'row')
                            .text(item.name)
                        )
                        .append($('<td>')
                            .text(parseInt(item.quantity).toLocaleString())
                        )
                        .append($('<td>')
                            .text(parseInt(diff).toLocaleString())
                        )
                    )
            })
        }
    }    
}

function getData(data, color) {
    return {
        labels: json.charts.palladiumStats.map(d => d.tick),
        datasets: [
          {
            data: json.charts.palladiumStats.map(d => d[data]),
            borderColor: color,
            backgroundColor: color,
          },
        ]
    };
}

function getConfig(data, title) {
    return {
        type: 'line',
        data,
        options: {
            elements: {
                point:{
                    radius: 0
                }
            },
            responsive: true,
            interaction: {
            mode: 'index',
            intersect: false,
            },
            plugins: {
            title: {
                display: true,
                text: title
            },
            legend: {
                display: false
            }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour'
                    }
                }
            }
        },
    };
}

var palladiumHourChart = null;
function renderPalladiumHourChart() {
    if (!(json?.charts?.palladiumStats)) {
        return;
    }
    if (!!palladiumHourChart) {
        var len = json.charts.palladiumStats.length
        palladiumHourChart.data.labels.push(json.charts.palladiumStats[len - 1].tick)
        palladiumHourChart.data.datasets[0].data.push(json.charts.palladiumStats[len - 1].totalh)
        palladiumHourChart.update('none')
    } else {
        const data = getData('totalh', 'blue')
        const config = getConfig(data, 'Collected per Hour')
        const ctx = document.getElementById('palladiumHourChart').getContext('2d');
        palladiumHourChart = new Chart(ctx, config);
    }
}

var palladiumTotalChart = null;
function renderPalladiumTotalChart() {
    if (!(json?.charts?.palladiumStats)) {
        return;
    }
    if (!!palladiumTotalChart) {
        var len = json.charts.palladiumStats.length
        palladiumTotalChart.data.labels.push(json.charts.palladiumStats[len - 1].tick)
        palladiumTotalChart.data.datasets[0].data.push(json.charts.palladiumStats[len - 1].total)
        palladiumTotalChart.update('none')
    } else {
        const data = getData('total', 'green')
        const config = getConfig(data, 'Total Collected')
        const ctx = document.getElementById('palladiumTotalChart').getContext('2d');
        palladiumTotalChart = new Chart(ctx, config);
    }
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

