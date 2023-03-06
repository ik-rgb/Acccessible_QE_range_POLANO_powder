const version = "0.1";
const decimal_digit = 1000;

const TOFscale = 10.0;    // ms to pixel
const Lscale=10.0;        // meter to pixel
const TOF_len_R = 40;       // Real TOF max (ms)
const TOFconst = 2.286;       // TOF at 1 m is 2.286/sqrt(E)

//Inst. parameters 
const L1_default=17.5;
const L2_default=2.0;
const L3_default=1.85;
const LT0_default=9.0;
let Ltotal_R =L1_default+L2_default;      // Real source to detector (m)
let Lsc_R = L1_default-L3_default;        // Real source chopper distance  (m)
let L1_R = L1_default;          // Real source to sample distance (m)
let LT0_R = LT0_default;        // Real source to T0 distance (m)
const DetBankNum = 9;
let tth_Max = new Array(DetBankNum);
let tth_Min = new Array(DetBankNum);
tth_Min = [-29.165,-9.165,3,10.835,30.835,50.835,70.835,90.835,110.835];
tth_Max = [-10.835,-3,9.165,29.165,49.165,69.165,89.165,109.165,129.165];

//Chopper parameters
let chopperFace=1;  //1: true, 0:false
let freq=300;
let T0_freq = 50;
let TargetEi =40;
let ChopOfst_R =0;      //Real chopper offset (ms)
let TOFs_at_Chopper = new Array(50);
let upperLimitEi = 500;    // upper limit of Ei 8eV
let Ei_num_ofst=0;
const Ei_numMax=5;
let Ei = new Array(Ei_numMax);
let isOptimumEi= (new Array(Ei_numMax)).fill(true);     //the incident neutron beam will be blocked by the T0 chopper when this parameter is "false".

//constants for TOF diagram
const TextSize = 10;      // pixel
const ChopperOpen = 4;    // pixel
const marginX = 50;
const marginY = 20;
const TickL = 8;
const T0_Chop_Const = 77.0/(2.0*Math.PI*300.0)*1000;     // (ms/Hz) cited from S. Itoh et al. Nuc. Inst. Methods in Phys. Research A61 86-92 (2012).


//lattice parameters
let a_star = 1.5;
let b_star = 1.5;
let gamma_star = 90.0;      //angle between a* and b*.

//scan parameters
let omg_1 =0.0;
let omg_2 = 0.0;
let omg_ofst=0;

const eps=1e-6;


window.addEventListener('load',()=>{
    //initialization processes.
    document.getElementById("verNum").innerHTML=version;
    document.getElementById("verNum2").innerHTML=version;
    setDefaultValues();
    setInstParams();
    setChopperParams();
    getEis();
    setLatticeParams();
    setScanParams();

    draw_all();

    document.getElementById('setChopperParams_button').addEventListener('click',()=>{
        setChopperParams();
        getEis();
        draw_all();
    });

    document.getElementById('setInstParams_button').addEventListener('click',()=>{
        setInstParams();
        getEis();
        draw_all();
    });

    document.getElementById('setLatticeParams_button').addEventListener('click',()=>{
        setLatticeParams();
        draw_all();
    });

    document.getElementById('setScanParams_button').addEventListener('click',()=>{
        setScanParams();
        draw_all();
    });

    for(let i=0;i<Ei_numMax;i++){
        const labelFracHbw='frac_hbw'+(Math.round(i+1));
        document.getElementById(labelFracHbw).addEventListener('input',()=>{
            draw_Qxy();
            drawQELineCuts();        
        });
    }

    for(let i=0;i<Ei_numMax;i++){
        const labelScanRange='setScanRange_button'+(Math.round(i+1));
        document.getElementById(labelScanRange).addEventListener('click',()=>{
            draw_Qxy();
            drawQELineCuts();        
        });
    }

    document.getElementById('setQVector_button').addEventListener('click',()=>{
        draw_Qxy();
    });

});

function setDefaultValues(){

    document.getElementById('input_L1').value=L1_default;
    document.getElementById('input_L2').value=L2_default;
    document.getElementById('input_L3').value=L3_default;
    document.getElementById('input_LT0').value=LT0_default;

    for (let j=0;j<DetBankNum;j+=1){
        const labelTThMax='D'+(Math.round(j+1))+'_tth_max';
        document.getElementById(labelTThMax).value=tth_Max[j];
        const labelTThMin='D'+(Math.round(j+1))+'_tth_min';
        document.getElementById(labelTThMin).value=tth_Min[j];    
    }

    document.getElementById('chopperFace').value=chopperFace;
    document.getElementById('freq').value=freq;
    document.getElementById('T0_freq').value=T0_freq;
    document.getElementById('upperLimitEi').value=upperLimitEi;
    document.getElementById('targetEi').value=TargetEi;


    for(let i=0;i<Ei_numMax;i++){
        const labelFracHbw='frac_hbw'+(Math.round(i+1));
        document.getElementById(labelFracHbw).value=0.0;
    }

}

function setInstParams(){
    const inputL1 = parseFloat(document.getElementById('input_L1').value);
    const inputL2 = parseFloat(document.getElementById('input_L2').value);
    const inputL3 = parseFloat(document.getElementById('input_L3').value);
    const inputLT0 = parseFloat(document.getElementById('input_LT0').value);
    Ltotal_R = inputL1+inputL2;      // Real source to detector (m)
    Lsc_R = inputL1-inputL3;        // Real source chopper distance  (m)
    L1_R = inputL1;          // Real source to sample distance (m)
    LT0_R = inputLT0;        // Real source to T0 distance (m)

    for (let j=0;j<DetBankNum;j+=1){
        const labelTThMax='D'+(Math.round(j+1))+'_tth_max';
        tth_Max[j] = parseFloat(document.getElementById(labelTThMax).value);
        const labelTThMin='D'+(Math.round(j+1))+'_tth_min';
        tth_Min[j] = parseFloat(document.getElementById(labelTThMin).value);    
    }

}

function setChopperParams(){
    chopperFace = Boolean(Number(document.getElementById('chopperFace').value));
    freq = parseFloat(document.getElementById('freq').value);
    T0_freq = parseFloat(document.getElementById('T0_freq').value);
    upperLimitEi = parseFloat(document.getElementById('upperLimitEi').value);
    TargetEi = parseFloat(document.getElementById('targetEi').value);

}

function getEis(){
    const TargetTOF_at_Chopper=(TOFconst*(Lsc_R)/Math.sqrt(TargetEi));
    const ChopPeriod_R = 1.0/freq*1000.0;       //Real chopper period (ms). Although a factor "1/2" is necessary for Fermi choppers with straight slits, the chopper of HRC has curved slits. So 1/2 is not necessary.
    const ChopRept = TOF_len_R/ChopPeriod_R;

    ChopOfst_R =0;      //Real chopper offset (ms)
    for (let tt=0;tt<=ChopRept;tt+=1){
        const t1=(tt)*ChopPeriod_R;
        const t2=(tt+1.0)*ChopPeriod_R;
        if ((TargetTOF_at_Chopper > t1) && (TargetTOF_at_Chopper <= t2) ){
            ChopOfst_R=TargetTOF_at_Chopper-t1;
        }
    }

    TOFs_at_Chopper[0]=(ChopOfst_R);    
    for (let i = 1; i < ChopRept; i += 1) {
        TOFs_at_Chopper[i]=(ChopPeriod_R*(i)+ChopOfst_R);    
    }

    // Determine Ei num offset
    Ei_num_ofst=0;
    for (let i=0;i<ChopRept;i+=1){
        const testE =(TOFconst/TOFs_at_Chopper[i]*(Lsc_R))**2.0 ;
        if (testE > upperLimitEi){
            Ei_num_ofst += 1;
        }    
    }
    document.getElementById('Ei_Num_ofst').value=Ei_num_ofst;

    for(let i=0;i<Ei_numMax;i+=1){
        const idE='E'+(i+1);
        document.getElementById(idE).value = Math.round((TOFconst/TOFs_at_Chopper[Ei_num_ofst+i]*(Lsc_R))**2.0*decimal_digit)/decimal_digit ;
        Ei[i]=(TOFconst/TOFs_at_Chopper[Ei_num_ofst+i]*(Lsc_R))**2.0 ;
    }

    const T0ChopPeriod_R = 1.0/T0_freq*1000.0/2;    //Real T0 chopper period (ms). A factor "1/2" is necessary for a symmetric rotor.
    const T0ChopRept = TOF_len_R/T0ChopPeriod_R;
    const T0_Blind_R = T0_Chop_Const/T0_freq;

    let T0_blind_start = 0;
    let T0_blind_end = T0_Blind_R;
    let TOF_at_T0 = TOFs_at_Chopper[Ei_num_ofst]/Lsc_R*LT0_R;

    isOptimumEi= (new Array(Ei_numMax)).fill(true);
    if(TOF_at_T0>T0_blind_start && TOF_at_T0<T0_blind_end){
        isOptimumEi[0]=false;
    }

    for (let i = 1; i <= T0ChopRept; i += 1) {

        T0_blind_start = T0ChopPeriod_R*(i)-T0_Blind_R;
        T0_blind_end = T0ChopPeriod_R*(i)+T0_Blind_R;

        for (let j=0;j<Ei_numMax;j+=1){
            TOF_at_T0 = TOFs_at_Chopper[Ei_num_ofst+j]/Lsc_R*LT0_R;
            if(TOF_at_T0>T0_blind_start && TOF_at_T0<T0_blind_end){
                isOptimumEi[j]=false;
            }
        }
    }


}

function setLatticeParams(){
    a_star = Number(document.getElementById('a_star').value);
    b_star = Number(document.getElementById('b_star').value);
    gamma_star = Number(document.getElementById('gamma_star').value);

}

function setScanParams(){
    omg_1 = Number(document.getElementById('omega1').value);
    omg_2 = Number(document.getElementById('omega2').value);
    omg_ofst = Number(document.getElementById('omg_ofst').value);
}


function draw_all() {

    draw_TOF_diagram();
    draw_Qxy();
    drawQELineCuts();
}

function draw_TOF_diagram(){

    const Ltotal=Ltotal_R*Lscale;
    const Lsc = Lsc_R*Lscale;
    const L1 = L1_R*Lscale;
    const LT0 = LT0_R*Lscale; 
    const TOF_len = TOF_len_R*TOFscale;


    //get elements from the document
    let canvas2 = document.getElementById('CanvasTOF');
    let context2 = canvas2.getContext('2d');

    const ChopPeriod_R = 1.0/freq*1000.0;       //Real chopper period (ms). Although a factor "1/2" is necessary for Fermi choppers with straight slits, the chopper of HRC has curved slits. So 1/2 is not necessary.
    const ChopPeriod = ChopPeriod_R*TOFscale;
    const ChopRept = TOF_len_R/ChopPeriod_R;

    const T0ChopPeriod_R = 1.0/T0_freq*1000.0/2;    //Real T0 chopper period (ms). A factor "1/2" is necessary for a symmetric rotor.
    const T0ChopPeriod = T0ChopPeriod_R*TOFscale;
    const T0ChopRept = TOF_len_R/T0ChopPeriod_R;
    const T0_Blind_R = T0_Chop_Const/T0_freq;
    const T0_Blind = T0_Blind_R*TOFscale;

    let displayChopperOfst = ChopOfst_R;
    if (chopperFace == true){
        displayChopperOfst +=0;
    }
    else {
        displayChopperOfst += ChopPeriod_R/2.0;       // Another half rotation is necessary to have optimum condition for the target Ei
    }
    document.getElementById('offset').value=Math.round(displayChopperOfst*decimal_digit)/decimal_digit;

    const ChopOfst = ChopOfst_R*TOFscale;

    
    //refresh
    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    context2.strokeStyle = "rgb(0, 0, 0)";
    context2.lineWidth=1;


    //text labels
    context2.font = "italic 10px sans-serif";
    context2.fillText("Chopper", 1, marginY+(Ltotal-Lsc)+TextSize/2);
    context2.fillText("Sample", 1, marginY+(Ltotal-L1)+TextSize/2);
    context2.fillText("Source", 1, marginY+(Ltotal)+TextSize/2);
    context2.fillText("Detector", 1, marginY+TextSize/2);
    context2.fillText("T0 Ch.", 1, marginY+(Ltotal-LT0)+TextSize/2);


    // x axis
    context2.beginPath();
    context2.moveTo(marginX, (Ltotal)+marginY);
    context2.lineTo(marginX, marginY);
    context2.stroke();

    // x ticks
    context2.font = " 10px sans-serif";
    for (let i=0;i<5;i+=1){
        context2.beginPath();
        context2.moveTo(marginX+TOF_len/4*i, marginY+Ltotal);
        context2.lineTo(marginX+TOF_len/4*i, marginY+Ltotal-TickL);
        context2.stroke();
        context2.fillText(i*10, marginX+TOF_len/4*i-TextSize/2, marginY+Ltotal+TextSize*1.5);
    }

    // x label
    context2.fillText("Time (ms)", marginX+TOF_len/2-TextSize, marginY+Ltotal+TextSize*3);

    // y axis
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY);
    context2.lineTo(marginX+TOF_len, Ltotal+marginY);
    context2.stroke();

    // sample position
    context2.strokeStyle = "rgb(180, 180, 180)";
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY-L1);
    context2.lineTo(marginX+TOF_len, Ltotal+marginY-L1);
    context2.stroke();

    // det position
    context2.strokeStyle = "rgb(180, 180, 180)";
    context2.beginPath();
    context2.moveTo(marginX, marginY);
    context2.lineTo(marginX+TOF_len, marginY);
    context2.stroke();


    //Fermi chopper
    context2.lineWidth=4;
    context2.strokeStyle = "rgb(100, 100, 100)";
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY-Lsc);
    context2.lineTo(marginX-ChopperOpen/2+ChopOfst, Ltotal+marginY-Lsc);
    context2.stroke();

    for (let i = 1; i < ChopRept; i += 1) {
        context2.beginPath();
        context2.moveTo(marginX+ChopPeriod*(i-1)+ChopperOpen/2+ChopOfst, Ltotal+marginY-Lsc);
        context2.lineTo(marginX+ChopPeriod*(i)-ChopperOpen/2+ChopOfst, Ltotal+marginY-Lsc);
        context2.stroke();
    }

    context2.lineWidth=6;
    context2.strokeStyle = "rgb(100, 100, 100)";
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY-LT0);
    context2.lineTo(marginX+T0_Blind, Ltotal+marginY-LT0);
    context2.stroke();

    
    for (let i = 1; i <= T0ChopRept; i += 1) {
        context2.beginPath();
        context2.moveTo(marginX+T0ChopPeriod*(i)-T0_Blind, Ltotal+marginY-LT0);
        context2.lineTo(marginX+T0ChopPeriod*(i)+T0_Blind, Ltotal+marginY-LT0);
        context2.stroke();
    }
//


    //Lines for each Ei
    context2.lineWidth=1;
    for (let i = 0; i < Ei_numMax; i += 1) {
        if (isOptimumEi[i]==true){
            context2.strokeStyle = "rgb(255, 0, 0)";
            context2.lineWidth=2;
        }
        else {
            context2.strokeStyle = "rgb(255, 150, 150)";
            context2.lineWidth=1;
        }
        context2.beginPath();
        context2.moveTo(marginX, marginY+Ltotal);
        context2.lineTo(marginX+TOFs_at_Chopper[Ei_num_ofst+i]*TOFscale*Ltotal/Lsc, marginY);
        context2.stroke();
    }
    context2.lineWidth=1;

}


function draw_Qxy(){

    let canvas3 = new Array(Ei_numMax);
    let context3 = new Array(Ei_numMax);

    const scale0 = 1.0;   // 2ki = canvas.width/2 when scale0=1.0

    let scale = new Array(Ei_numMax);
    let ki = new Array(Ei_numMax);
    let frac_hbw = new Array(Ei_numMax);

    const radius = 3; // radius for each reciprocal lattice point

    for (let j=0;j<Ei_numMax;j+=1){
        let labelCanvasQxy='CanvasQxy'+(Math.round(j+1));
        canvas3[j] = document.getElementById(labelCanvasQxy);
        context3[j] = canvas3[j].getContext('2d');
        ki[j]=Math.sqrt(Ei[j]/2.072);
        scale[j] = canvas3[0].width/2.0/(2.0*ki[j])*scale0;

        const labelFrac_hbw='frac_hbw'+(Math.round(j+1));
        frac_hbw[j] = Number(document.getElementById(labelFrac_hbw).value);

        const labelHbw='hbw'+(Math.round(j+1));
        document.getElementById(labelHbw).value = Math.round(Ei[j]*frac_hbw[j]*decimal_digit)/decimal_digit;

        const labelEicalc='E'+(Math.round(1+j))+'_calc';
        document.getElementById(labelEicalc).innerHTML = Math.round(Ei[j]*decimal_digit)/decimal_digit;
        
    }

    const originX = canvas3[0].width/2.0;
    const originY = canvas3[0].height/2.0;

    let psi1 = -(omg_1-omg_ofst);
    let psi2 = -(omg_2-omg_ofst);

    document.getElementById('Psi1').value=psi1;
    document.getElementById('Psi2').value=psi2;

    if (psi2 < psi1){
        const temp_psi2 = psi2;
        psi2=psi1;
        psi1=temp_psi2;
    }


    let qh = new Array(3);
    let qk = new Array(3);
    qh[0] = Number(document.getElementById('qh1').value);
    qk[0] = Number(document.getElementById('qk1').value);
    qh[1] = Number(document.getElementById('qh2').value);
    qk[1] = Number(document.getElementById('qk2').value);
    qh[2] = Number(document.getElementById('qh3').value);
    qk[2] = Number(document.getElementById('qk3').value);




    //accessible area
    //CCW rotation of sample -> CW rotation of accessible range (omg -> -omg)
    const cospsi1 = Math.cos(-Math.PI/180.0*psi1);
    const sinpsi1 = Math.sin(-Math.PI/180.0*psi1);

    const cospsi2 = Math.cos(-Math.PI/180.0*psi2);
    const sinpsi2 = Math.sin(-Math.PI/180.0*psi2);


    for(let p=0;p<Ei_numMax;p+=1){

        //refresh
        context3[p].clearRect(0, 0, canvas3[p].width, canvas3[p].height);
        context3[p].strokeStyle = "rgb(0, 0, 0)";
        context3[p].lineWidth=1;

        const kf = Math.sqrt(Ei[p]*(1.0-frac_hbw[p])/2.072);


        for(let i_tth=0;i_tth<DetBankNum;i_tth+=1){

            context3[p].beginPath();
            context3[p].lineWidth=1;

            let dX=(Math.cos(Math.PI/180.0*tth_Min[i_tth])*kf-1.0*ki[p])*scale[p];
            let dY=(Math.sin(Math.PI/180.0*tth_Min[i_tth]))*kf*scale[p];

            const tempX = cospsi1*dX - sinpsi1*dY;
            const tempY = sinpsi1*dX + cospsi1*dY;

            dX = tempX;
            dY = tempY;

            context3[p].moveTo(originX+dX, originY-dY);

            for (let tth= tth_Min[i_tth]; tth <= tth_Max[i_tth]; tth += 0.5) {
                let dX=(Math.cos(Math.PI/180.0*tth)*kf-1.0*ki[p])*scale[p];
                let dY=(Math.sin(Math.PI/180.0*tth))*kf*scale[p];

                const tempX = cospsi1*dX - sinpsi1*dY;
                const tempY = sinpsi1*dX + cospsi1*dY;

                dX = tempX;
                dY = tempY;

                context3[p].lineTo(originX+dX , originY - dY);
            }
            for (let psi= psi1; psi < psi2; psi += 0.5) {
                let dX=(Math.cos(Math.PI/180.0*tth_Max[i_tth])*kf-1.0*ki[p])*scale[p];
                let dY=(Math.sin(Math.PI/180.0*tth_Max[i_tth]))*kf*scale[p];

                const tempX = Math.cos(-Math.PI/180.0*psi)*dX - Math.sin(-Math.PI/180.0*psi)*dY;
                const tempY = Math.sin(-Math.PI/180.0*psi)*dX + Math.cos(-Math.PI/180.0*psi)*dY;

                dX = tempX;
                dY = tempY;

                context3[p].lineTo(originX+dX , originY - dY);
            }
            for (let i= tth_Max[i_tth]; i >= tth_Min[i_tth]; i -= 0.5) {
                let dX=(Math.cos(Math.PI/180.0*i)*kf-1.0*ki[p])*scale[p];
                let dY=(Math.sin(Math.PI/180.0*i))*kf*scale[p];

                const tempX = cospsi2*dX - sinpsi2*dY;
                const tempY = sinpsi2*dX + cospsi2*dY;

                dX = tempX;
                dY = tempY;
                context3[p].lineTo(originX+dX , originY - dY);
            }
            for (let psi= psi2; psi > psi1; psi -= 0.5) {
                let dX=(Math.cos(Math.PI/180.0*tth_Min[i_tth])*kf-1.0*ki[p])*scale[p];
                let dY=(Math.sin(Math.PI/180.0*tth_Min[i_tth]))*kf*scale[p];

                const tempX = Math.cos(-Math.PI/180.0*psi)*dX - Math.sin(-Math.PI/180.0*psi)*dY;
                const tempY = Math.sin(-Math.PI/180.0*psi)*dX + Math.cos(-Math.PI/180.0*psi)*dY;

                dX = tempX;
                dY = tempY;

                context3[p].lineTo(originX+dX , originY - dY);
            }
            context3[p].fillStyle="rgb(220, 230, 250)";
            context3[p].fill();
            context3[p].strokeStyle="rgb(0, 0, 250)";
            context3[p].stroke();

        }

        //R-lattice
        const cosGamma = Math.cos(Math.PI/180.0*gamma_star);
        const sinGamma = Math.sin(Math.PI/180.0*gamma_star);

        const Hmax = parseInt(2.0*ki[p]/a_star*2);
        const Kmax = parseInt(2.0*ki[p]/b_star*2);

        //q-vector 1
        context3[p].fillStyle="rgb(50, 220, 50)";
        for (let h=-Hmax;h<=Hmax;h+=1){
            for (let k=-Kmax;k<=Kmax;k+=1){
                //hkl+q
                let PosX = originX-((h+qh[0])*a_star+(k+qk[0])*b_star*cosGamma)*scale[p];
                let PosY = originY-(-(k+qk[0])*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }
                //hkl-q
                PosX = originX-((h-qh[0])*a_star+(k-qk[0])*b_star*cosGamma)*scale[p];
                PosY = originY-(-(k-qk[0])*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }
            }
        }

        //q-vector 2
        context3[p].fillStyle="rgb(50, 150, 250)";
        for (let h=-Hmax;h<=Hmax;h+=1){
            for (let k=-Kmax;k<=Kmax;k+=1){
                //hkl+q
                let PosX = originX-((h+qh[1])*a_star+(k+qk[1])*b_star*cosGamma)*scale[p];
                let PosY = originY-(-(k+qk[1])*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }
                //hkl-q
                PosX = originX-((h-qh[1])*a_star+(k-qk[1])*b_star*cosGamma)*scale[p];
                PosY = originY-(-(k-qk[1])*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }
            }
        }

        //q-vector 3
        context3[p].fillStyle="rgb(250, 150, 100)";
        for (let h=-Hmax;h<=Hmax;h+=1){
            for (let k=-Kmax;k<=Kmax;k+=1){
                //hkl+q
                let PosX = originX-((h+qh[2])*a_star+(k+qk[2])*b_star*cosGamma)*scale[p];
                let PosY = originY-(-(k+qk[2])*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }
                //hkl-q
                PosX = originX-((h-qh[2])*a_star+(k-qk[2])*b_star*cosGamma)*scale[p];
                PosY = originY-(-(k-qk[2])*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }

            }
        }

        //R-lattice
        context3[p].fillStyle="rgb(150, 150, 150)";

        for (let h=-Hmax;h<=Hmax;h+=1){
            for (let k=-Kmax;k<=Kmax;k+=1){
                let PosX = originX-(h*a_star+k*b_star*cosGamma)*scale[p];
                let PosY = originY-(-k*b_star*sinGamma)*scale[p];
                if ((Math.abs(PosX-originX)<canvas3[p].width/2.0)&&(Math.abs(PosY-originY)<canvas3[p].height/2.0)){
                    context3[p].beginPath();
                    context3[p].arc(PosX,PosY, radius, 0, 2 * Math.PI);
                    context3[p].fill();
                }
            }
        }

        // draw a star
        context3[p].beginPath();
        context3[p].strokeStyle="rgb(250, 100, 100)";
        context3[p].lineWidth=2;
        context3[p].moveTo(originX,originY);
        context3[p].lineTo(originX-a_star*scale[p] , originY);
        context3[p].stroke();

        const arrow_head = 12;
        const font_size = 14;
        context3[p].beginPath();
        context3[p].lineWidth=1;
        context3[p].fillStyle="rgb(250, 100, 100)";
        //context3[p].moveTo(originX-a_star*scale[p] , originY);
        context3[p].moveTo(originX-a_star*scale[p] , originY-arrow_head/2);
        context3[p].lineTo(originX-a_star*scale[p]-arrow_head*0.7 , originY);
        context3[p].lineTo(originX-a_star*scale[p] , originY+arrow_head/2);
        context3[p].fill();
        context3[p].font = "italic 14px sans-serif";
        context3[p].fillText("a*", originX-a_star*scale[p]/2-font_size , originY-font_size/3 )

        // draw b star
        context3[p].beginPath();
        context3[p].strokeStyle="rgb(250, 100, 100)";
        context3[p].lineWidth=2;
        context3[p].moveTo(originX,originY);
        context3[p].lineTo(originX-b_star*cosGamma*scale[p], originY+b_star*sinGamma*scale[p]);
        context3[p].stroke();

        context3[p].beginPath();
        context3[p].lineWidth=1;
        context3[p].fillStyle="rgb(250, 100, 100)";

        let arrow_head_X = Array(3);
        let arrow_head_Y = Array(3);
        arrow_head_X[0]=-b_star*scale[p];
        arrow_head_Y[0]=-arrow_head/2.0;

        arrow_head_X[1]=-b_star*scale[p]-arrow_head*0.7;
        arrow_head_Y[1]=0.0;

        arrow_head_X[2]=-b_star*scale[p];
        arrow_head_Y[2]=arrow_head/2.0;

        for (let l=0;l<3;l+=1){
            let tempX=cosGamma*arrow_head_X[l]-sinGamma*arrow_head_Y[l];
            let tempY=sinGamma*arrow_head_X[l]+cosGamma*arrow_head_Y[l];
            arrow_head_X[l]=tempX;
            arrow_head_Y[l]=tempY;

        }
        context3[p].moveTo(originX+arrow_head_X[0] , originY-arrow_head_Y[0]);
        context3[p].lineTo(originX+arrow_head_X[1] , originY-arrow_head_Y[1]);
        context3[p].lineTo(originX+arrow_head_X[2] , originY-arrow_head_Y[2]);
        context3[p].fill();
        context3[p].font = "italic 14px sans-serif";
        context3[p].fillText("b*", originX+arrow_head_X[1]/2-font_size*1.4, originY-arrow_head_Y[1]/2+font_size );

        //draw scan range
        const labelStartH = 'startH'+(Math.round(p+1));
        const labelStartK = 'startK'+(Math.round(p+1));
        const startH = Number(document.getElementById(labelStartH).value);
        const startK = Number(document.getElementById(labelStartK).value);

        const scanStartPosX = originX-(startH*a_star+startK*b_star*cosGamma)*scale[p];
        const scanStartPosY = originY-(-startK*b_star*sinGamma)*scale[p];

        const labelEndH = 'endH'+(Math.round(p+1));
        const labelEndK = 'endK'+(Math.round(p+1));
        const endH = Number(document.getElementById(labelEndH).value);
        const endK = Number(document.getElementById(labelEndK).value);

        const scanEndPosX = originX-(endH*a_star+endK*b_star*cosGamma)*scale[p];
        const scanEndPosY = originY-(-endK*b_star*sinGamma)*scale[p];

        context3[p].beginPath();
        context3[p].lineWidth=2;
        context3[p].strokeStyle="rgb(200, 50, 250)";
        context3[p].moveTo(scanStartPosX , scanStartPosY);
        context3[p].lineTo(scanEndPosX , scanEndPosY);
        context3[p].stroke();

    }


}

function drawQELineCuts() {

    let canvas4 = new Array(Ei_numMax);
    let context4 = new Array(Ei_numMax);

    for(let ii=0;ii<Ei_numMax;ii+=1){
        const canvasName='CanvasQE'+(Math.round(ii+1));
        canvas4[ii] = document.getElementById(canvasName);
        context4[ii] = canvas4[ii].getContext('2d');    
    }

    let psi1 = -(omg_1-omg_ofst);
    let psi2 = -(omg_2-omg_ofst);
    if (psi2 < psi1){
        const temp_psi2 = psi2;
        psi2=psi1;
        psi1=temp_psi2;
    }

    // to aboid zero-division
    if((psi1==0)||(Math.abs(psi1)==90)){
        psi1+=0.1;
    }
    // to aboid zero-division
    if((psi2==0)||(Math.abs(psi2)==90)){
        psi2+=0.1;
    }
   
    let ki = new Array(Ei_numMax);
    for (let j=0;j<Ei_numMax;j+=1){
        ki[j]=Math.sqrt(Ei[j]/2.072);
    }


    let psiRept=2;
    let cosPsi = new Array(psiRept);
    let sinPsi = new Array(psiRept);

    cosPsi[0] = Math.cos(Math.PI/180.0*psi1);
    sinPsi[0] = Math.sin(Math.PI/180.0*psi1);

    cosPsi[1] = Math.cos(Math.PI/180.0*psi2);
    sinPsi[1] = Math.sin(Math.PI/180.0*psi2);

    const cosGamma = Math.cos(Math.PI/180.0*gamma_star);
    const sinGamma = Math.sin(Math.PI/180.0*gamma_star);

    const OriginX = 30;
    const OriginY = 270;


    for(let ii=0;ii<Ei_numMax;ii+=1){   // for loop for five Eis.
        //refresh
        context4[ii].clearRect(0, 0, canvas4[ii].width, canvas4[ii].height);
        context4[ii].strokeStyle = "rgb(0, 0, 0)";
        context4[ii].lineWidth=1;

        const labelStartH = 'startH'+(Math.round(ii+1));
        const labelStartK = 'startK'+(Math.round(ii+1));
        const startH = Number(document.getElementById(labelStartH).value);
        const startK = Number(document.getElementById(labelStartK).value);
        const startQx = -(startH*a_star+startK*b_star*cosGamma);
        const startQy = (-startK*b_star*sinGamma);

        const labelEndH = 'endH'+(Math.round(ii+1));
        const labelEndK = 'endK'+(Math.round(ii+1));
        const endH = Number(document.getElementById(labelEndH).value);
        const endK = Number(document.getElementById(labelEndK).value);
        const endQx = -(endH*a_star+endK*b_star*cosGamma);
        const endQy = (-endK*b_star*sinGamma);


        const fullQLength=Math.sqrt((endQx-startQx)**2.0+(endQy-startQy)**2.0);
        const fullScanX=endQx-startQx;
        const fullScanY=endQy-startQy;
    
        for(let m=0;m<DetBankNum;m+=1){
        for(let sign =-1;sign<2;sign+=2){
        for(let kk=0;kk<psiRept;kk+=1){
        
            const rotStartQx=cosPsi[kk]*startQx - sinPsi[kk]*startQy;
            const rotStartQy=sinPsi[kk]*startQx + cosPsi[kk]*startQy;
    
            const rotEndQx=cosPsi[kk]*endQx - sinPsi[kk]*endQy;
            const rotEndQy=sinPsi[kk]*endQx + cosPsi[kk]*endQy;
    
            const A1=(rotEndQy-rotStartQy)/(rotEndQx-rotStartQx);
            const B1=rotEndQy-A1*rotEndQx;
    
    
            context4[ii].beginPath();
            context4[ii].strokeStyle="rgb(0, 0, 250)";
            context4[ii].lineWidth=1;
    
            let isFirstPoint=true;
            let Ystep=canvas4[ii].height;
            
            for(let jj=0;jj<=Ystep;jj+=1){
                let Ef=1.4*Ei[ii]-((1.3)*Ei[ii])/Ystep*jj;
                let kf = Math.sqrt(Ef/2.072);

                let limQxMax = 0;
                let limQxMin = 0;
                if(m>1){
                    limQxMin=(Math.cos(Math.PI/180.0*tth_Max[m])*kf-1.0*ki[ii]);
                    limQxMax=(Math.cos(Math.PI/180.0*tth_Min[m])*kf-1.0*ki[ii]);
                }
                else{
                    limQxMax=(Math.cos(Math.PI/180.0*tth_Max[m])*kf-1.0*ki[ii]);
                    limQxMin=(Math.cos(Math.PI/180.0*tth_Min[m])*kf-1.0*ki[ii]);
                }

                const aa=(1+1/(A1*A1));
                const bb=-2.0*(B1/(A1*A1)-ki[ii]/A1);
                const cc=(B1/A1-ki[ii])*(B1/A1-ki[ii])-kf*kf;
    
                if ((bb*bb-4.0*aa*cc)>0){
        
                    const QyEdge1=(-bb+sign*Math.sqrt(bb*bb-4.0*aa*cc))/(2.0*aa);
                    const QxEdge1=(QyEdge1-B1)/A1;

                    let drawFlag=false;

                    if((QxEdge1>=limQxMin)&&(QxEdge1<=limQxMax)){
                        if(m>1 && QyEdge1>=0){
                            drawFlag=true;
                        }
                        else if (m<2 && QyEdge1<0){
                            drawFlag=true;
                        }
                    }

                    if(drawFlag==true){
                        const rotBackQxEdge1=cosPsi[kk]*QxEdge1+sinPsi[kk]*QyEdge1;
                        const rotBackQyEdge1=-sinPsi[kk]*QxEdge1+cosPsi[kk]*QyEdge1;
    
                        const distQx=rotBackQxEdge1-startQx;
                        const distQy=rotBackQyEdge1-startQy;
    
                        const productQ = fullScanX*distQx+fullScanY*distQy;
                        
                        if(isFirstPoint==true){
                            context4[ii].moveTo(OriginX+productQ/fullQLength**2.0*(canvas4[ii].width-OriginX*3),canvas4[ii].height-jj*1);
                            isFirstPoint=false;
                        }
                        else{
                            context4[ii].lineTo(OriginX+productQ/fullQLength**2.0*(canvas4[ii].width-OriginX*3),canvas4[ii].height-jj*1);
                        }    
                    }
                
                }
            }        
            context4[ii].stroke();
        }   // end of psiRept loop
        }   // end of sign loop
        }   // end of DetBankNum loop


        for (let m=0;m<DetBankNum;m+=1){
        for(let TTHsign =0;TTHsign<2;TTHsign+=1){
        for(let sign =-1;sign<2;sign+=2){

            context4[ii].beginPath();
            context4[ii].strokeStyle="rgb(0, 0, 250)";
            context4[ii].lineWidth=1;

            let isFirstPoint=true;
            const Ystep=canvas4[ii].height;
            
            for(let jj=0;jj<=Ystep;jj+=1){
                const Ef=1.4*Ei[ii]-((1.3)*Ei[ii])/Ystep*jj;
                const kf = Math.sqrt(Ef/2.072);
                let TTH_lim = 0;
                if (TTHsign==0){
                    TTH_lim=tth_Min[m];
                }
                else{
                    TTH_lim=tth_Max[m];
                }

                const QlimSq = (kf*Math.sin(Math.PI/180.0*TTH_lim))**2.0+(kf*Math.cos(Math.PI/180*TTH_lim)-ki[ii])**2.0;
                let AlphaZero = Math.atan2(kf*Math.sin(Math.PI/180.0*TTH_lim),kf*Math.cos(Math.PI/180.0*TTH_lim)-ki[ii]);//0;
                if(AlphaZero<0){
                    AlphaZero=AlphaZero+2*Math.PI;
                }
                let AlphaMin = AlphaZero-psi2/180.0*Math.PI;
                let AlphaMax = AlphaZero-psi1/180.0*Math.PI;
                
                if(AlphaMax<AlphaMin){
                    AlphaMax=AlphaMax+2.0*Math.PI;
                }

                let QyEdge1=0;
                let QxEdge1=0;
                let drawFlag=false;
                if(Math.abs(startQx-endQx)<eps){
                    if(QlimSq-startQx**2.0 > 0){
                        QyEdge1=sign*Math.sqrt(QlimSq-startQx**2.0);
                        QxEdge1=startQx;
                        drawFlag=true;
                    }
                }
                else if (Math.abs(startQy-endQy)<eps){
                    if(QlimSq-startQy**2.0 >= 0){
                        QxEdge1=sign*Math.sqrt(QlimSq-startQy**2.0);
                        QyEdge1=startQy;
                        drawFlag=true;
                    }
                }
                else{
                    const A1=(endQy-startQy)/(endQx-startQx);
                    const B1=endQy-A1*endQx;

                    const aa=(1+A1*A1);
                    const bb=2.0*A1*B1;
                    const cc=B1*B1-QlimSq;
        
                    if ((bb*bb-4.0*aa*cc)>0){
                        QxEdge1=(-bb+sign*Math.sqrt(bb*bb-4.0*aa*cc))/(2.0*aa);
                        QyEdge1=A1*QxEdge1+B1;
                        drawFlag=true;
                    }
                }

                if(drawFlag==true){
                    const distQx=QxEdge1-startQx;
                    const distQy=QyEdge1-startQy;
    
                    const productQ = fullScanX*distQx+fullScanY*distQy;
    
                    AlphaTgt=Math.atan2(QyEdge1,QxEdge1);
    
                    if(AlphaTgt<0){
                        AlphaTgt=AlphaTgt+2.0*Math.PI;
                    }
    
                    if((AlphaTgt>=AlphaMin)&&(AlphaTgt<=AlphaMax)){
                        if(isFirstPoint==true){
                            context4[ii].moveTo(OriginX+productQ/fullQLength**2.0*(canvas4[ii].width-OriginX*3),canvas4[ii].height-jj*1);
                            isFirstPoint=false;
                        }
                        else{
                            context4[ii].lineTo(OriginX+productQ/fullQLength**2.0*(canvas4[ii].width-OriginX*3),canvas4[ii].height-jj*1);
                        }    
                    } 
                    else{
                        isFirstPoint=true;
                    }   
                }
                else{
                    isFirstPoint=true;
                }

            }        
            context4[ii].stroke();

        }   // end of sign loop            
        }   // end of TTHsign loop
        }   // end of DetBankNum loop*/

        context4[ii].beginPath();
        context4[ii].strokeStyle="rgb(150, 150, 150)";
        context4[ii].lineWidth=1;
        context4[ii].moveTo(OriginX,canvas4[ii].height);
        context4[ii].lineTo(OriginX,0);
        context4[ii].stroke();

        context4[ii].beginPath();
        context4[ii].moveTo(OriginX,OriginY);
        context4[ii].lineTo(OriginX+canvas4[ii].width,OriginY);
        context4[ii].stroke();

        context4[ii].beginPath();
        context4[ii].moveTo(canvas4[ii].width-OriginX*2,canvas4[ii].height);
        context4[ii].lineTo(canvas4[ii].width-OriginX*2,0);
        context4[ii].stroke();

        // x ticks
        context4[ii].font = " 12px sans-serif";
        const EthickBar=5;
        let Espacing=20;
        let TextSize=20;
        if(Ei[ii]>100){
            Espacing=20;
            TextSize=25;
        }
        else if (Ei[ii]>50){
            Espacing=10;
            TextSize=20;
        }
        else if(Ei[ii]>10){
            Espacing=2;
            TextSize=20;
        }
        else if(Ei[ii]>5){
            Espacing=1;
            TextSize=20;
        }
        else {
            Espacing=0.5;
            TextSize=25;
        }

        const Estep= ((1.3)*Ei[ii])/canvas4[ii].height;  // energy (meV) per pixel

        // tick marks for y(energy)axis
        for (let i=-10;i<20;i+=1){
            context4[ii].beginPath();
            context4[ii].moveTo(OriginX, OriginY-Espacing/Estep*i);
            context4[ii].lineTo(OriginX+EthickBar, OriginY-Espacing/Estep*i);
            context4[ii].stroke();
            context4[ii].fillText(i*Espacing,OriginX-TextSize, OriginY-Espacing/Estep*i);
        }
        //*/
        // tick marks for x(q)axis
        const qTickBar=10;
        const tickSpan=(canvas4[ii].width-OriginX*3)/10;
        for (let i=1;i<10;i+=1){
            context4[ii].beginPath();
            if(i==5){
                context4[ii].moveTo(OriginX+tickSpan*i, OriginY-qTickBar);
                context4[ii].lineTo(OriginX+tickSpan*i, OriginY+qTickBar);    
            }
            else{
                context4[ii].moveTo(OriginX+tickSpan*i, OriginY-qTickBar/2);
                context4[ii].lineTo(OriginX+tickSpan*i, OriginY+qTickBar/2);    
            }
            context4[ii].stroke();
        }

        const startHK = '('+startH+','+startK+')';
        const padding1=4;
        const lineHeight=15;
        context4[ii].fillText(startHK,OriginX+padding1, OriginY+lineHeight);

        const endHK = '('+endH+','+endK+')';
        context4[ii].fillText(endHK,canvas4[ii].width-OriginX*2+padding1, OriginY+lineHeight);

        //horizontal bar showing the energy transfer
        const labelFracHbw = 'frac_hbw'+Math.round(ii+1);
        const frac_hbw = Number(document.getElementById(labelFracHbw).value);
        context4[ii].beginPath();
        context4[ii].strokeStyle="rgb(255, 0, 0)";
        context4[ii].lineWidth=1;
        context4[ii].moveTo(0, OriginY-Ei[ii]*frac_hbw/Estep);
        context4[ii].lineTo(canvas4[ii].width, OriginY-Ei[ii]*frac_hbw/Estep);    
        context4[ii].stroke();

    }   // end of for-loop for five Eis


}
