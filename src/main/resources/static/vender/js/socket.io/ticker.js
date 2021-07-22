let tickerSocket = new WebSocket("wss://api.upbit.com/websocket/v1");
tickerSocket.binaryType = 'arraybuffer';

let krwMarkets = [];
let markets = [];
let CoinJson;
let CoinList;
let cardSound = true;

$.ajax({
    url: "https://api.upbit.com/v1/market/all?isDetails=false",
    type: "get",
    async: false,
    success: (data) => {
        krwMarkets = data.filter((n) => {
            return (n.market).split("-")[0] == "KRW";
        });
    }
});

krwMarkets.forEach((v, k) => {
    markets.push(v.market);
});

let ioData =  JSON.stringify([{"ticket":"testasdasd"},{"type":"trade","codes":markets}]);

tickerSocket.onopen = ((e) => {
    tickerSocket.send(ioData);
});

tickerSocket.onclose = (() => {
});

tickerSocket.onmessage = ((data) => {
    let enc = new TextDecoder("utf-8");
    let arr = new Uint8Array(data.data);
    let arrToJson = JSON.parse(enc.decode(arr));

    let totalPrice = arrToJson.trade_price * arrToJson.trade_volume;
    let marketKoreanName = krwMarkets.filter((n) => {
        return n.market == arrToJson.code;
    });

    if ($(document).find("#" + arrToJson.code + "-Signal").length > 0) {
        if ($(document).find("#" + arrToJson.code + "-Signal").closest(".card").find(".trade_price").text().toString() != arrToJson.trade_price.toString()) {
            if (arrToJson.ask_bid == "ASK") {
                $(document).find("#" + arrToJson.code + "-Signal").closest(".card").animate({"background-color": "#d1e7dd"}, 500);

            } else {
                $(document).find("#" + arrToJson.code + "-Signal").closest(".card").animate({"background-color": "#f8d7da"}, 500);
            }

            //$(document).find("#" + arrToJson.code + "-Signal").closest(".card").animate({"background-color": "#fff"}, 500);
        }

        $(document).find("#" + arrToJson.code + "-Signal").closest(".card").find(".trade_price").text(numberWithComma(arrToJson.trade_price));
    }

    if (totalPrice > 20000000) {

        Utils.getHtmlFromWeb(arrToJson.code);
        CoinJson = JSON.parse(CoinList);
        let CoinMovings = GetMovingAvg();

        let datas = {
            "code": arrToJson.code,
            "markets": marketKoreanName[0].korean_name, // 마켓
            "trade": numberWithComma(arrToJson.trade_price), // 현재가
            "totalPrice": numberToKorean2(totalPrice),
            "price": totalPrice,
            "ask_bid": arrToJson.ask_bid,
            "rsi": CoinMovings[2],
            "bbt": CoinMovings[0],
            "bbb": CoinMovings[1]
        }

        viewTradeTicker2(datas);
    } else {
        let datas = {
            "code": arrToJson.code,
            "markets": marketKoreanName[0].korean_name, // 마켓
            "trade": numberWithComma(arrToJson.trade_price), // 현재가
            "totalPrice": numberToKorean2(totalPrice),
            "price": totalPrice,
            "ask_bid": arrToJson.ask_bid,
            "rsi": '-',
            "bbt": '-',
            "bbb": '-'
        }
        if (datas.price > 100000000) {
            viewTradeTicker3(datas);
        }
    }
});

tickerSocket.onerror = ((e) => {
    console.log(e);
});

let viewTradeTicker2 = (datas) => {

    let colors = (datas.ask_bid == "ASK") ? "success" : "danger";
    let askbid = (datas.ask_bid == "ASK") ? "매수" : "매도";

    if (cardSound) {
        if (datas.ask_bid == "ASK") {
            example4(261.6, 'sine');
            let o = setTimeout(example4, 200, 440.0, 'sine');
        } else {
            example4(440.0, 'sine');
            let o = setTimeout(example4, 200, 261.6, 'sine');
        }
    }

    let tickerCardLength = $("#upbitWhale").find("li").length;
    if (tickerCardLength >= 50) {
        $("#upbitWhale").find("li").last().remove();
    }

    if (datas.price > 100000000) {
        let msg = `[${datas.markets}]\n\n체결가 ${datas.trade}원에 ${datas.totalPrice} ${askbid}`;
        $(".toast-body").text(msg);
        notify(msg);

        $("#toast_container").css("z-index", "9999");
        $("#toast1").toast("show");
        $("#toast1").toast("show");
        $("#toast1").toast("show");
        $("#toast1").toast("show");
        $("#toast1").toast("show");

        setTimeout(() => {
            $("#toast_container").css("z-index", "-1");
        }, 6000);
    }

    let template = `
        <li class="list-group-item list-group-item-${colors}">
            <div class="d-flex">
                <div class="me-auto bd-highlight" style="width: 10em;">${datas.markets}</div>
                <div class="me-auto bd-highlight" style="width: 2em;">${askbid}</div>
                <div class="bd-highlight" style="width:5em;">${datas.trade}</div>
                <div class="bd-highlight text-center" style="margin-left: 20px; width:3em;">${datas.totalPrice}</div>
                <div class="bd-highlight text-center" style="margin-left: 20px; width:2em;">${datas.rsi}</div>
                <div class="bd-highlight" style="margin-left: 20px; width:5em;">${datas.bbt}</div>
                <div class="bd-highlight" style="margin-left: 20px; width:5em;">${datas.bbb}</div>
            </div>
        </li>
    `;

    $("#upbitWhale").prepend(template);

    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month >= 10 ? month : '0' + month
    let day = date.getDate();
    day = day >= 10 ? day : '0' + day
    let hour = date.getHours();
    hour = hour >= 10 ? hour : '0' + hour
    let min = date.getMinutes();
    min = min >= 10 ? min : '0' + min
    let sec = date.getSeconds();
    sec = sec >= 10 ? sec : '0' + sec

    let fullDate = year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

    let accuratePrice = (datas.ask_bid == "ASK") ? datas.price : 0 - datas.price;

    let signalTemplate = `
        <div class="col-3 card-container">
            <div class="card text-center">
                <div class="card-header">
                    [${datas.markets}]
                </div>
                <div class="card-body">
                    <h5 class="card-title" data-total-price="${accuratePrice}">${numberToKorean2(accuratePrice)}</h5>
                    <p class="card-text text-secondary">현재가<br><span class="trade_price">${datas.trade}</span><!--&#9;|&#9;BB上 <span class="bbt">${datas.bbt}</span>&#9;|&#9;BB下 <span class="bbb">${datas.bbb}</span>--></p>
                </div>
                <div class="card-footer text-muted">
                    <div class="d-flex progress">
                        <div class="me-auto progress-bar progress-bar-striped progress-bar-animated bg-success askProgress" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%">
                            50%
                        </div>
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger bidProgress" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%">
                            50%
                        </div>
                    </div>
                </div>
                <div class="card-footer text-muted">
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-striped timeouts"
                             id="${datas.code}-Signal"
                             role="progressbar"
                             aria-valuenow="100"
                             aria-valuemin="0"
                             aria-valuemax="100"
                             style="width: 100%"
                             data-start-time="${fullDate}">
                            경과 시간 00분 00초
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if ($(document).find("#" + datas.code + "-Signal").length <= 0) {
        $("#askBidSignal").append(signalTemplate);
    } else {
        let totalPrice = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").attr("data-total-price"));
        let resultPrice = totalPrice + accuratePrice;
        $(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").attr("data-total-price", resultPrice);
        $(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").text(numberToKorean2(resultPrice));
        $(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-text").find(".trade_price").text(datas.trade);
    }

    let totalPrice = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").attr("data-total-price"));
    let askAddPer = 50 / 1000000000 * totalPrice;
    let nowAskProgress = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").attr("aria-valuenow"));
    let nowBidProgress = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").attr("aria-valuenow"));

    let resultAskProgress = (50 - askAddPer).toFixed(2);
    let resultBidProgress = (50 + askAddPer).toFixed(2);

    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").attr("aria-valuenow", resultAskProgress);
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").attr("aria-valuenow", resultBidProgress);
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").css("width", resultAskProgress + "%");
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").css("width", resultBidProgress + "%");
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").text(resultAskProgress + "%");
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").text(resultBidProgress + "%");


    $("#upbitWhaleUpdatedTime").text("lastUpdated " + fullDate);
}

let viewTradeTicker3 = (datas) => {

    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month >= 10 ? month : '0' + month
    let day = date.getDate();
    day = day >= 10 ? day : '0' + day
    let hour = date.getHours();
    hour = hour >= 10 ? hour : '0' + hour
    let min = date.getMinutes();
    min = min >= 10 ? min : '0' + min
    let sec = date.getSeconds();
    sec = sec >= 10 ? sec : '0' + sec

    let fullDate = year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

    let accuratePrice = (datas.ask_bid == "ASK") ? datas.price : 0 - datas.price;

    let signalTemplate = `
        <div class="col-3 card-container">
            <div class="card text-center">
                <div class="card-header">
                    [${datas.markets}]
                </div>
                <div class="card-body">
                    <h5 class="card-title" data-total-price="${accuratePrice}">${numberToKorean2(accuratePrice)}</h5>
                    <p class="card-text text-secondary">현재가<br><span class="trade_price">${datas.trade}</span><!--&#9;|&#9;BB上 <span class="bbt">${datas.bbt}</span>&#9;|&#9;BB下 <span class="bbb">${datas.bbb}</span>--></p>
                </div>
                <div class="card-footer text-muted">
                    <div class="d-flex progress">
                        <div class="me-auto progress-bar progress-bar-striped progress-bar-animated bg-success askProgress" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%">
                            50%
                        </div>
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger bidProgress" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%">
                            50%
                        </div>
                    </div>
                </div>
                <div class="card-footer text-muted">
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-striped timeouts"
                             id="${datas.code}-Signal"
                             role="progressbar"
                             aria-valuenow="100"
                             aria-valuemin="0"
                             aria-valuemax="100"
                             style="width: 100%"
                             data-start-time="${fullDate}">
                            경과 시간 00분 00초
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if ($(document).find("#" + datas.code + "-Signal").length <= 0) {
        $("#askBidSignal").append(signalTemplate);
    } else {
        let totalPrice = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").attr("data-total-price"));
        let resultPrice = totalPrice + accuratePrice;
        $(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").attr("data-total-price", resultPrice);
        $(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").text(numberToKorean2(resultPrice));
        $(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-text").find(".trade_price").text(datas.trade);
    }

    let totalPrice = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".card-title").attr("data-total-price"));
    let askAddPer = 50 / 1000000000 * totalPrice;
    let nowAskProgress = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").attr("aria-valuenow"));
    let nowBidProgress = parseFloat($(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").attr("aria-valuenow"));

    let resultAskProgress = (50 - askAddPer).toFixed(2);
    let resultBidProgress = (50 + askAddPer).toFixed(2);

    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").attr("aria-valuenow", resultAskProgress);
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").attr("aria-valuenow", resultBidProgress);
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").css("width", resultAskProgress + "%");
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").css("width", resultBidProgress + "%");
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".askProgress").text(resultAskProgress + "%");
    $(document).find("#" + datas.code + "-Signal").closest(".card").find(".bidProgress").text(resultBidProgress + "%");
}

let numberToKorean2 = (number) => {

    let resultString = "";

    if (number > 0) {
        if (number >= 1000000000) {
            resultString = (number / 1000000000).toFixed(0) + "십억";
        } else if (number >= 100000000) {
            resultString = (number / 100000000).toFixed(0) + "억";
        } else if (number >= 10000000) {
            resultString = (number / 10000000).toFixed(0) + "천";
        } else if (number >= 1000000) {
            resultString = (number / 1000000).toFixed(0) + "백";
        } else if (number >= 100000) {
            resultString = (number / 100000).toFixed(0) + "십";
        }
    } else {
        number = Math.abs(number);
        if (number >= 1000000000) {
            resultString = 0 - (number / 1000000000).toFixed(0) + "십억";
        } else if (number >= 100000000) {
            resultString = 0 - (number / 100000000).toFixed(0) + "억";
        } else if (number >= 10000000) {
            resultString = 0 - (number / 10000000).toFixed(0) + "천";
        } else if (number >= 1000000) {
            resultString = 0 - (number / 1000000).toFixed(0) + "백";
        } else if (number >= 100000) {
            resultString = (number / 100000).toFixed(0) + "백";
        }
    }

    return resultString;
}

let Utils = {
    getHtmlFromWeb: (CoinCode) => {
        $.ajax({
            url: "https://api.upbit.com/v1/candles/minutes/15?market=" + CoinCode +"&count=200",
            type: "get",
            dataType: "text",
            async: false,
            success: (data) => {
                console.warn = console.error = () => {};
                CoinList = data;
            }
        });
    }
}

function GetMovingAvg() {
    var MovingAvg = [0, 0, 0];

    var sum = 0;
    var avg = 0.00;

    for(var i = 20; i>=0; i--) {
        try {
            sum += CoinJson[i].trade_price;
        }catch(e) {

            break;
        }
    }

    avg = sum/20;

    var pyun = 0;
    for(var i = 19; i>=0; i--) {
        pyun += Math.pow((CoinJson[i].trade_price - avg), 2);
    }

    pyun = Math.sqrt(pyun / 20);

    var BUp = avg + pyun * 2;
    var BDown = avg - pyun * 2;

    if (BUp >= 100) {
        BUp = BUp.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
        BUp = parseFloat(numberWithComma(BUp.toFixed(2)));
    }

    if (BDown >= 100) {
        BDown = BDown.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
        BDown = parseFloat(numberWithComma(BDown.toFixed(2)));
    }

    MovingAvg[0] = BUp;
    MovingAvg[1] = BDown;

    MovingAvg[2] = getRSI();

    return MovingAvg;
}

function getRSI() {
    var AU = 0;
    var AD = 0;
    var first = true;
    for (var j=CoinJson.length - 15; j>=0; j--) {
        if (first) {
            for (var i = j; i < j + 14; i++) {
                if (CoinJson[i].trade_price > CoinJson[i + 1].trade_price) {
                    AU += (CoinJson[i].trade_price - CoinJson[i + 1].trade_price) / 14;
                } else {
                    AD += (CoinJson[i + 1].trade_price - CoinJson[i].trade_price) / 14;
                }
            }
        } else {
            for (var i = j; i < j + 14; i++) {
                if (CoinJson[i].trade_price > CoinJson[i + 1].trade_price) {
                    AU *= 13 + (CoinJson[i].trade_price - CoinJson[i + 1].trade_price) / 14;
                } else {
                    AD *= 13 + (CoinJson[i + 1].trade_price - CoinJson[i].trade_price) / 14;
                }
            }
        }
    }

    var RS = AU / AD;

    return (100 - (100 / (1 + RS))).toFixed(2);
}

var context = new AudioContext();
var o = null;
var g = null;

function example4(frequency, type) {
    o = context.createOscillator()
    g = context.createGain()
    o.type = type
    o.connect(g)
    o.frequency.value = frequency
    g.connect(context.destination)
    o.start(0)
    g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 1)
}

function notify(msg) {
    if (Notification.permission !== 'granted') {
        //alert('notification is disabled');
    }
    else {
        var notification = new Notification('업비트!! 큰 고래 알림!!!', {
            icon: 'https://www.pngitem.com/pimgs/m/116-1166875_icon-megaphone-marketing-icon-transparent-background-hd-png.png',
            body: msg,
        });

        notification.onclick = function () {
            window.open('http://localhost:8080/');
        };
    }
}