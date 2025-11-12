// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
// 動畫與顯示狀態
let displayScore = 0;      // 畫面上顯示的分數（動畫過程中會平滑過渡）
let animActive = false;    // 是否正在播放動畫
let animStart = 0;         // 動畫開始時間（ms）
let animDur = 2000;        // 動畫長度預設（ms）
let animType = '';


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        console.log("新的分數已接收:", scoreText);

        // 啟動動畫：決定分數區間（0-60,61-80,81-100），並開始動畫
        startScoreAnimation();
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() {
    // 將 p5 畫布放入頁面上的 #scoreCanvas 容器，並且支援響應式大小
    const container = document.getElementById('scoreCanvas') || document.body;
    const w = Math.max(280, container.clientWidth || 360);
    const h = Math.max(220, Math.min(420, Math.round(w * 0.65)));
    const cnv = createCanvas(w, h);
    cnv.parent('scoreCanvas');
    cnv.style.display = 'block';
    cnv.style.margin = '0';
    cnv.style.padding = '0';
    background(255);
    noLoop(); // 只在需要時重新繪製
}

function draw() {
    background(0);
    const percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : NaN;

    if (animActive) {
        const t = constrain((millis() - animStart) / animDur, 0, 1);
        const ease = 1 - pow(1 - t, 3);
        displayScore = lerp(displayScore, finalScore, ease);

        if (animType === 'low') {
            drawLowAnimation(t, displayScore);
        } else if (animType === 'mid') {
            drawMidAnimation(t, displayScore);
        } else if (animType === 'high') {
            drawHighAnimation(t, displayScore);
        }

        if (t >= 1) {
            animActive = false;
            displayScore = finalScore;
            noLoop();
            drawScoreOnly(displayScore, percentage);
        }

        return;
    }

    if (!isFinite(percentage)) {
        fill(120);
        textSize(28);
        textAlign(CENTER);
        text('尚未收到成績', width / 2, height / 2);
    } else {
        drawScoreOnly(finalScore, percentage);
    }
}

// 只顯示分數（根據分數區間著色）
function drawScoreOnly(scoreToShow, percentage) {
    textAlign(CENTER);
    textSize(72);
    const centerY = height / 2;

    // 根據分數區間設定分數顏色
    if (percentage >= 90) {
        fill(0, 200, 80);  // 綠色
    } else if (percentage >= 60) {
        fill(255, 180, 40);  // 黃橘色
    } else if (percentage > 0) {
        fill(220, 40, 40);  // 紅色
    } else {
        fill(100);  // 灰色
    }

    text(`${Math.round(scoreToShow)}`, width / 2, centerY + 20);
}
// 啟動分數動畫，選擇動畫類型並開始繪製循環
function startScoreAnimation(){
    // 計算百分比並選擇動畫類型
    const pct = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    if (!isFinite(pct)) return;
    if (pct <= 60) {
        animType = 'low';
        animDur = 2000;
    } else if (pct <= 80) {
        animType = 'mid';
        animDur = 2200;
    } else {
        animType = 'high';
        animDur = 2600;
    }
    animActive = true;
    animStart = millis();
    // 從 0 開始計數動畫
    displayScore = 0;
    loop();
}

// 低分動畫（0-60）：紅色脈動 + 飄散小圓點
function drawLowAnimation(t, scoreNow){
    // 背景淡紅脈動
    const alpha = 80 + 120 * (1 - t);
    noStroke();
    fill(255, 220, 220, alpha);
    rect(0,0,width,height);

    // 飄散小圓
    for(let i=0;i<12;i++){
        const ang = (i/12.0)*TWO_PI + t*PI*2;
        const r = 60 + 80 * sin(t*PI + i);
        const x = width/2 + cos(ang)*r + random(-6,6);
        const y = height/2 + sin(ang)*r + random(-6,6);
        fill(200,30,30,160*(1-t));
        circle(x,y,6+6*noise(i,t));
    }

    // 中央分數
    textAlign(CENTER);
    textSize(64);
    fill(220,40,40);
    text(`${Math.round(scoreNow)}`, width/2, height/2 + 20);
}

// 中等分數動畫（61-80）：黃橘色光環與旋轉方塊
function drawMidAnimation(t, scoreNow){
    background(250,245,235);
    // 放射線
    push();translate(width/2,height/2+40);
    noFill();
    for(let i=0;i<10;i++){
        stroke(255,190,60, 200*(1 - t));
        strokeWeight(2);
        rotate(PI/15 + t*0.8);
        line(0,0,0, - (120 + i*8) * (1 - 0.15*i/10));
    }
    pop();

    // 旋轉方塊
    push();translate(width/2, height/2 + 30);
    rotate(t * PI * 1.5);
    rectMode(CENTER);
    noStroke();
    fill(255,200,60,220);
    for(let s=0;s<3;s++){
        push();rotate(s*0.5);
        rect(0,0,140 - s*30,140 - s*30,12);
        pop();
    }
    pop();

    // 分數
    textAlign(CENTER);
    textSize(60);
    fill(255,180,40);
    text(`${Math.round(scoreNow)}`, width/2, height/2 + 20);
}

// 高分動畫（81-100）：綠色慶祝（泡泡/confetti）
function drawHighAnimation(t, scoreNow){
    // 漸層背景
    for(let y=0;y<height;y++){
        const inter = map(y,0,height,0,1);
        const r = lerp(240,230,inter);
        const g = lerp(255,245,inter);
        const b = lerp(245,240,inter);
        stroke(r,g,b);line(0,y,width,y);
    }

    // 爆炸泡泡
    noStroke();
    for(let i=0;i<18;i++){
        const ang = i/18.0 * TWO_PI + t*PI*2;
        const dist = map(i%6,0,5,20,180) * t + random(-6,6);
        const x = width/2 + cos(ang)*dist;
        const y = height/2 + sin(ang)*dist - 20*t*80;
        fill(20,180,80, 220*(1 - 0.6*t));
        circle(x,y,8 + 10*noise(i + t));
    }

    // 分數
    textAlign(CENTER);
    textSize(68);
    fill(0,200,80);
    text(`${Math.round(scoreNow)}`, width/2, height/2 + 20);
}

// 當視窗大小改變時，讓畫布跟著容器大小調整
function windowResized() {
    const container = document.getElementById('scoreCanvas') || document.body;
    const w = Math.max(280, container.clientWidth || 360);
    const h = Math.max(220, Math.min(420, Math.round(w * 0.65)));
    resizeCanvas(w, h);
    redraw();
}
