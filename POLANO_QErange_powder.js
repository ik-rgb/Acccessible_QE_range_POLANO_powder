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
const LT0_default=8.5;
let Ltotal_R =L1_default+L2_default;      // Real source to detector (m)
let Lsc_R = L1_default-L3_default;        // Real source chopper distance  (m)
let L1_R = L1_default;          // Real source to sample distance (m)
let LT0_R = LT0_default;        // Real source to T0 distance (m)
const DetBankNum = 9;
let tth_min=3.0;
let tth_max=129.165;

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


const eps=1e-6;
let OriginX = 50;     // X origin of the Q-E map
let OriginY = 270;    // y origin of the Q-E map


window.addEventListener('load',()=>{
    //initialization processes.
    document.getElementById("verNum").innerHTML=version;
    document.getElementById("verNum2").innerHTML=version;
    setDefaultValues();
    setInstParams();
    setChopperParams();
    getEis();

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

    document.getElementById('setTargetEvalues_button').addEventListener('click',()=>{
        drawQErange();
    });

    document.getElementById('setTargetQvalues_button').addEventListener('click',()=>{
        drawQErange();
    });

    document.getElementById('setQErange_button').addEventListener('click',()=>{
        drawQErange();
    });
});

function setDefaultValues(){

    document.getElementById('input_L1').value=L1_default;
    document.getElementById('input_L2').value=L2_default;
    document.getElementById('input_L3').value=L3_default;
    document.getElementById('input_LT0').value=LT0_default;

    document.getElementById('tth_max').value=tth_max;
    document.getElementById('tth_min').value=tth_min;

    document.getElementById('chopperFace').value=chopperFace;
    document.getElementById('freq').value=freq;
    document.getElementById('T0_freq').value=T0_freq;
    document.getElementById('upperLimitEi').value=upperLimitEi;
    document.getElementById('targetEi').value=TargetEi;



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

    tth_max = parseFloat(document.getElementById('tth_max').value);
    tth_min = parseFloat(document.getElementById('tth_min').value);

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

    for (let j=0;j<Ei_numMax;j+=1){
        const labelEicalc='E'+(Math.round(1+j))+'_calc';
        document.getElementById(labelEicalc).innerHTML = Math.round(Ei[j]*decimal_digit)/decimal_digit;
    }


}



function draw_all() {

    draw_TOF_diagram();
    drawQErange();
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




function drawQErange() {

    let canvas4 = new Array(Ei_numMax);
    let context4 = new Array(Ei_numMax);

    if(document.getElementById("QErange_Man").checked){
        Qrange_in_ki_unit=Number(document.getElementById("Q_max").value);
        Ef_min_in_ki_unit=Number(document.getElementById("Ef_min").value);
        Ef_max_in_ki_unit=Number(document.getElementById("Ef_max").value);    
    }
    else {
            Qrange_in_ki_unit=2.0;
            Ef_min_in_ki_unit=0.1;
            Ef_max_in_ki_unit=1.4;    
    }
    

    for(let ii=0;ii<Ei_numMax;ii+=1){
        const canvasName='CanvasQE'+(Math.round(ii+1));
        canvas4[ii] = document.getElementById(canvasName);
        context4[ii] = canvas4[ii].getContext('2d');    
    }

    let ki = new Array(Ei_numMax);
    for (let j=0;j<Ei_numMax;j+=1){
        ki[j]=Math.sqrt(Ei[j]/2.072);
    }


    for(let ii=0;ii<Ei_numMax;ii+=1){   // for loop for five Eis.
        //refresh
        context4[ii].clearRect(0, 0, canvas4[ii].width, canvas4[ii].height);
        context4[ii].strokeStyle = "rgb(0, 0, 0)";
        context4[ii].lineWidth=1;

        let Ystep=canvas4[ii].height
        context4[ii].beginPath();
        context4[ii].lineWidth=1;
        let isFirstPoint=true;

        Q_max = ki[ii]*Qrange_in_ki_unit;

        for(let jj=0;jj<=Ystep;jj+=1){
            let Ef=Ef_max_in_ki_unit*Ei[ii]-((Ef_max_in_ki_unit-Ef_min_in_ki_unit)*Ei[ii])/Ystep*jj;
            let kf = Math.sqrt(Ef/2.072);
            let Q = Math.sqrt(ki[ii]**2.0+kf**2.0-2.0*ki[ii]*kf*Math.cos(Math.PI/180.0*tth_min));

            if(isFirstPoint==true){
                context4[ii].moveTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
                isFirstPoint=false;
            }
            else{
                context4[ii].lineTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
            }    
        }

        for(let jj=Ystep;jj>=0;jj-=1){
            let Ef=Ef_max_in_ki_unit*Ei[ii]-((Ef_max_in_ki_unit-Ef_min_in_ki_unit)*Ei[ii])/Ystep*jj;
            let kf = Math.sqrt(Ef/2.072);
            let Q = Math.sqrt(ki[ii]**2.0+kf**2.0-2.0*ki[ii]*kf*Math.cos(Math.PI/180.0*tth_max));

            if(isFirstPoint==true){
                context4[ii].moveTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
                isFirstPoint=false;
            }
            else{
                context4[ii].lineTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
            }    
        }
        context4[ii].fillStyle="rgb(220, 230, 250)";
        context4[ii].fill();
        context4[ii].strokeStyle="rgb(0, 0, 250)";
        context4[ii].stroke();

        context4[ii].fillStyle="rgb(0, 0, 0)";
        context4[ii].beginPath();
        context4[ii].strokeStyle="rgb(150, 150, 150)";
        context4[ii].lineWidth=1;
        context4[ii].moveTo(OriginX,canvas4[ii].height);
        context4[ii].lineTo(OriginX,0);
        context4[ii].stroke();


        OriginY=canvas4[ii].height*(1.0-Ef_min_in_ki_unit)/((Ef_max_in_ki_unit-1) + (1.0-Ef_min_in_ki_unit));

        context4[ii].beginPath();
        context4[ii].moveTo(OriginX,OriginY);
        context4[ii].lineTo(OriginX+canvas4[ii].width,OriginY);
        context4[ii].stroke();

        // x ticks
        context4[ii].font = " 12px sans-serif";
        let EthickBar=5;
        let Espacing=20;
        let Qspacing=0.5;
        if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>100){
            Espacing=50;
        }
        else if (Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>50){
            Espacing=10;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>20){
            Espacing=5;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>10){
            Espacing=2;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>5){
            Espacing=1;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>2){
            Espacing=0.5;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>1){
            Espacing=0.2;
        }
        else {
            Espacing=0.1;
        }

        if(Q_max>10){
            Qspacing=2;
        }
        else if (Q_max>5){
            Qspacing=1;
        }
        else if(Q_max>2){
            Qspacing=0.5;
        }
        else if(Q_max>1){
            Qspacing=0.5;
        }
        else if(Q_max>0.5){
            Qspacing=0.2;
        }
        else if(Q_max>0.1){
            Qspacing=0.05;
        }
        else {
            Qspacing=0.2;
        }

        let Escale = ((Ef_max_in_ki_unit-Ef_min_in_ki_unit)*Ei[ii])/canvas4[ii].height;  // energy (meV) per pixel
        let Qscale = Q_max/(canvas4[ii].width-OriginX); 

        context4[ii].font = "12px sans-serif";
        // tick marks for y(energy)axis
        for (let i=-10;i<20;i+=1){
            context4[ii].beginPath();
            context4[ii].moveTo(OriginX, OriginY-Espacing/Escale*i);
            context4[ii].lineTo(OriginX+EthickBar, OriginY-Espacing/Escale*i);
            context4[ii].stroke();
            let txt_ofst_x=TextSize;
            if(i*Espacing>=100){
                txt_ofst_x=TextSize*2.5;
            }
            else if (i*Espacing>=10){
                txt_ofst_x=TextSize*2;
            }
            else if (i*Espacing>=1){
                txt_ofst_x=TextSize*1.5;
            }
            else if (i*Espacing>0){
                txt_ofst_x=TextSize*2;
            }
            else if (i*Espacing< -100){
                txt_ofst_x=TextSize*4;
            }
            else if (i*Espacing<= -10){
                txt_ofst_x=TextSize*3;
            }
            else if (i*Espacing< 0){
                txt_ofst_x=TextSize*2;
            }
            else if (i== 0){
                txt_ofst_x=TextSize*1.5;
            }

            if (Espacing< 1){
                txt_ofst_x+=TextSize;
            }

            context4[ii].fillText(Math.round(i*Espacing*decimal_digit)/decimal_digit,OriginX-txt_ofst_x, OriginY-Espacing/Escale*i+TextSize/2);
        }
        //*/
        // tick marks for x(q)axis
        let qTickBar=10;
        let QtickSpan=Qspacing/Qscale;
        for (let i=1;i<10;i+=1){
            context4[ii].beginPath();
            context4[ii].moveTo(OriginX+QtickSpan*i, OriginY-qTickBar/2);
            context4[ii].lineTo(OriginX+QtickSpan*i, OriginY+qTickBar/2);    
            context4[ii].stroke();
            context4[ii].fillText(Math.round(i*Qspacing*decimal_digit)/decimal_digit,OriginX+QtickSpan*i-TextSize/2, OriginY+TextSize*2);
        }

        context4[ii].font = "14px sans-serif";
        const padding1=10;
        context4[ii].fillText('E (meV)',OriginX+padding1, TextSize*2);
        context4[ii].fillText('Q (A-1)',canvas4[ii].width-OriginX, OriginY-TextSize*1);

        ///horizontal bars showing the target energies
        for(let j=1;j<=12;j+=1){
            const label_targetE = 'Et_'+Math.round(j);
            if(document.getElementById(label_targetE).value){
                const targetE = Number(document.getElementById(label_targetE).value);
                context4[ii].beginPath();
                context4[ii].strokeStyle="rgb(255, 0, 0)";
                context4[ii].fillStyle="rgb(255, 0, 0)";
                context4[ii].lineWidth=1;
                context4[ii].moveTo(OriginX, OriginY-targetE/Escale);
                context4[ii].lineTo(canvas4[ii].width-OriginX-TextSize*2, OriginY-targetE/Escale);    
                context4[ii].fillText(Math.round(targetE*decimal_digit)/decimal_digit+" meV",canvas4[ii].width-OriginX-TextSize*1.5, OriginY-targetE/Escale+TextSize/2);
                context4[ii].stroke();
            }
        }

        ///vertical bars showing the target energies
        for(let j=1;j<=12;j+=1){
            const label_targetQ = 'Qt_'+Math.round(j);
            if(document.getElementById(label_targetQ).value){
                const targetQ = Number(document.getElementById(label_targetQ).value);
                context4[ii].beginPath();
                context4[ii].strokeStyle="rgb(0, 200, 0)";
                context4[ii].fillStyle="rgb(0, 200, 0)";
                context4[ii].lineWidth=1;
                context4[ii].moveTo(OriginX+targetQ/Qscale, canvas4[ii].height);
                context4[ii].lineTo(OriginX+targetQ/Qscale, TextSize);    
                context4[ii].fillText(Math.round(targetQ*decimal_digit)/decimal_digit+" A-1",OriginX+targetQ/Qscale-TextSize, TextSize);
                context4[ii].stroke();
            }
        }
        
    }   // end of for-loop for five Eis

}
