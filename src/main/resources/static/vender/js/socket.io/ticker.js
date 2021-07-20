let tickerSocket = new WebSocket("wss://api.upbit.com/websocket/v1");
tickerSocket.binaryType = 'arraybuffer';

let krwMarkets = [];
let markets = [];
let CoinJson;
let CoinList;

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

console.log(markets);

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

    if (totalPrice > 10000000) {

        Utils.getHtmlFromWeb(arrToJson.code);
        console.log(CoinList);
        CoinJson = JSON.parse(CoinList);
        let CoinMovings = GetMovingAvg();

        let datas = {
            "markets": marketKoreanName[0].korean_name, // 마켓
            "trade": numberWithComma(arrToJson.trade_price), // 현재가
            "totalPrice": numberToKorean2(totalPrice),
            "ask_bid": arrToJson.ask_bid,
            "rsi": CoinMovings[2],
            "bbt": CoinMovings[0],
            "bbb": CoinMovings[1]
        }

        console.log(datas);

        viewTradeTicker2(datas);
    }
});

tickerSocket.onerror = ((e) => {
    console.log(e);
});

let viewTradeTicker2 = (datas) => {

    let colors = (datas.ask_bid == "ASK") ? "danger" : "primary";
    let askbid = (datas.ask_bid == "ASK") ? "매수" : "매도";

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

    $("#upbitWhaleUpdatedTime").text("lastUpdated " + fullDate);
}

let numberToKorean2 = (number) => {

    let resultString = "";

    if (number >= 1000000000) {
        resultString = (number / 1000000000).toFixed(0) + "십억";
    } else if (number >= 100000000) {
        resultString = (number / 100000000).toFixed(0) + "억";
    } else if (number >= 10000000) {
        resultString = (number / 10000000).toFixed(0) + "천만";
    } else if (number >= 1000000) {
        resultString = (number / 1000000).toFixed(0) + "백만";
    }

    return resultString;
}

let Utils = {
    getHtmlFromWeb: (CoinCode) => {
        $.ajax({
            url: "https://api.upbit.com/v1/candles/minutes/5?market=" + CoinCode +"&count=200",
            type: "get",
            dataType: "text",
            async: false,
            success: (data) => {
                console.log(data);
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