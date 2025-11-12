// 完整重寫：即時成績顯示區（單一分數 + 三種動畫）

// 全域狀態
let finalScore = 0;
let maxScore = 100;
let pct = NaN;

let animType = null; // 'low' | 'mid' | 'high'
let animActive = false;
let animStart = 0;
let animDur = 1800;
let displayScore = 0;

// 接收來自 H5P 的分數訊息
window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || data.type !== 'H5P_SCORE_RESULT') return;
    finalScore = Number(data.score) || 0;
    maxScore = Number(data.maxScore) || 100;
    pct = (maxScore > 0) ? (finalScore / maxScore) * 100 : NaN;

    if (!isFinite(pct)) return;
    if (pct <= 60) { animType = 'low'; animDur = 1500; }
    else if (pct <= 80) { animType = 'mid'; animDur = 2000; }
    else { animType = 'high'; animDur = 2400; }

    animActive = true;
    animStart = millis();
    displayScore = 0;
    loop();
});

function setup(){
    const container = document.getElementById('scoreCanvas') || document.body;
    const w = Math.max(260, container.clientWidth || 320);
    const h = Math.max(180, Math.round(w * 0.6));
    const cnv = createCanvas(w, h);
    cnv.parent('scoreCanvas');
    cnv.style.display = 'block';
    cnv.style.width = '100%';
    cnv.style.height = 'auto';
    clear();
    noLoop();
}

function draw(){
    clear(); // 透明底

    // 尚未收到分數時顯示提示文字（灰色）
    if (!isFinite(pct) && !animActive) {
        push();
        textAlign(CENTER, CENTER);
        fill(140);
        textSize(min(width, height) * 0.08);
        text('尚未收到成績', width / 2, height / 2);
        pop();
        return; // 不做其他繪製
    }

    if (animActive) {
        const t = constrain((millis() - animStart) / animDur, 0, 1);
        const eased = easeOutCubic(t);
        displayScore = lerp(displayScore, finalScore, eased);

        if (animType === 'low') drawLowAnim(t, displayScore);
        else if (animType === 'mid') drawMidAnim(t, displayScore);
        else if (animType === 'high') drawHighAnim(t, displayScore);

        if (t >= 1) {
            animActive = false;
            displayScore = finalScore;
            drawScoreOnly(displayScore, pct);
            noLoop();
        }
        return;
    }

    drawScoreOnly(finalScore, pct);
}

function easeOutCubic(t){ return 1 - pow(1 - t, 3); }

function drawScoreOnly(value, pctVal){
    push();
    textAlign(CENTER, CENTER);
    const cY = height/2;
    const n = Math.round(value).toString();

    // 準備文字：前綴、主要分數 (n/max)、百分比在下方
    const prefix = '分數:';
    const main = `${n}/${maxScore}`;
    // 字型大小設定
    const mainSize = Math.floor(min(width, height) * 0.32);
    const prefixSize = Math.floor(mainSize * 0.46);
    const pctSize = Math.floor(mainSize * 0.38);
    const gap = Math.max(6, Math.floor(mainSize * 0.06));

    // 計算總寬並置中
    textSize(prefixSize);
    const prefixW = textWidth(prefix);
    textSize(mainSize);
    const mainW = textWidth(main);
    const totalW = prefixW + gap + mainW;
    const startX = width/2 - totalW/2;

    // 繪製 prefix（灰色）
    textSize(prefixSize);
    fill(140);
    textAlign(LEFT, CENTER);
    text(prefix, startX, cY - Math.floor(mainSize * 0.08));

    // 繪製主要分數（依分數區間變色），並讓百分比與主要分數同色
    textSize(mainSize);
    // 決定顏色（p5 的 color() 物件或灰階值）
    let mainColor;
    if (!isFinite(pctVal)) {
        mainColor = color(140);
    } else if (pctVal <= 60) {
        mainColor = color(220, 40, 40);
    } else if (pctVal <= 80) {
        mainColor = color(255, 180, 40);
    } else {
        mainColor = color(0, 200, 80);
    }
    textAlign(LEFT, CENTER);
    fill(mainColor);
    text(main, startX + prefixW + gap, cY - Math.floor(mainSize * 0.08));

    // 百分比在下方（使用即時顯示的百分比，如果 anim 中為 display value）
    const pctNow = isFinite(maxScore) && maxScore > 0 ? Math.round((Number(n) / maxScore) * 100) : 0;
    textSize(pctSize);
    fill(mainColor);
    textAlign(CENTER, CENTER);
    text(`${pctNow}%`, width/2, cY + Math.floor(mainSize * 0.6));
    pop();
}

// 低分動畫
function drawLowAnim(t, value){
    push(); noStroke();
    const a = lerp(200, 40, t);
    fill(255,220,220, a);
    rect(0,0,width,height);
    pop();

    push();
    for (let i=0;i<12;i++){
        const ang = (TWO_PI * i / 12) + t * PI * 2;
        const r = 20 + 120 * (1 - t) * (0.4 + 0.6 * noise(i));
        const x = width/2 + cos(ang) * r + sin(t*PI + i) * 6;
        const y = height/2 + sin(ang) * r + cos(t*PI + i) * 6;
        noStroke(); fill(200,40,40, 200 * (1 - t));
        circle(x,y, 6 + 6*noise(i + t));
    }
    pop();

    drawScoreOnly(value, pct);
}

// 中分動畫
function drawMidAnim(t, value){
    push();
    translate(width/2, height/2);
    rotate(t * PI * 0.8);
    for (let i=0;i<10;i++){
        push(); rotate((TWO_PI/10)*i);
        stroke(255,200,80, 200 * (1 - t));
        strokeWeight(2);
        line(12,0, width*0.22 * (0.6 + 0.4 * (1 - t)), 0);
        pop();
    }
    pop();

    push(); translate(width/2, height/2 + 6);
    rotate(t * PI * 1.2);
    noStroke(); fill(255,200,60, 200);
    rectMode(CENTER);
    for (let s=0;s<3;s++){
        push(); rotate(s * 0.35);
        const sz = map(s,0,2, width*0.42, width*0.22) * (0.6 + 0.4 * (1 - t));
        rect(0,0, sz, sz, 10);
        pop();
    }
    pop();

    drawScoreOnly(value, pct);
}

// 高分動畫
function drawHighAnim(t, value){
    push();
    for (let y=0;y<height;y+=6){
        const mix = map(y,0,height,0,1);
        stroke(240 - mix*10, 255 - mix*10, 245 - mix*5, 140*(1 - t));
        line(0,y,width,y);
    }
    pop();

    push();
    for (let i=0;i<18;i++){
        const ang = i/18.0 * TWO_PI + t*PI*2;
        const dist = map(i%6,0,5,20, height*0.6) * t + random(-6,6);
        const x = width/2 + cos(ang)*dist;
        const y = height/2 + sin(ang)*dist - t * 40;
        noStroke(); fill(20,180,80, 220*(1 - 0.4*t));
        circle(x,y, 6 + 10*noise(i + t));
    }
    pop();

    drawScoreOnly(value, pct);
}

function windowResized(){
    const container = document.getElementById('scoreCanvas') || document.body;
    const w = Math.max(260, container.clientWidth || 320);
    const h = Math.max(180, Math.round(w * 0.6));
    resizeCanvas(w, h);
    redraw();
}
