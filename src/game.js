const Stage = require('./stage');
const THREE = require('three');
const { NormalBlock: Block, FallingBlock } = require('./block');

class Game {
  constructor() {
    this.STATES = {
      LOADING: 'loading',
      PLAYING: 'playing',
      READY: 'ready',
      ENDED: 'ended',
      RESETTING: 'resetting'
    }
    this.SKYCLR1=[0xEBF5FB,0xD6EAF8,0xAED6F1,0x5DADE2,0x3498DB,0x2E86C1,0x21618C,0x1B4F72];
    this.SKYCLR=[0xEBF5FB,0xD6EAF8,0xAED6F1,0x5DADE2,0x3498DB,0x2E86C1,0x21618C,0x1B4F72]; 
    this.BgStart=0;
    this.BgFinish=3;
    
    this.blocks = [];
    this.fallingBlocks = [];
    this.state = this.STATES.LOADING;
    
    this.startcolor=0;
    this.endcolor= 100; 

    this.stage = new Stage();
    this.Score = 0;
    this.HScore = 0;
    this.mainContainer = document.getElementById('container');
    this.scoreContainer = document.getElementById('score');
    this.startButton = document.getElementById('start-button');
    this.instructions = document.getElementById('instructions');
    this.highscorecotainer = document.getElementById('highscore');
    this.scoreContainer.innerHTML = '0';
    this.highscorecotainer.innerHTML = '0';

    this.music = document.getElementById('music')
    this.addBlock();
    this.addbackground();
    this.tick();

    for (let key in this.STATES) {
      this.mainContainer.classList.remove(this.STATES[key]);
    }
    this.setState(this.STATES.READY);

    document.addEventListener('keydown', e => {
      if(e.keyCode === 32) { // Space
        this.handleEvent();
      }
    });


    document.addEventListener('touchstart', e => {
      this.handleEvent();
    });
  }

  handleEvent() {
    switch (this.state) {
      case this.STATES.READY:
        this.setState(this.STATES.PLAYING);
        
        this.stage.sound.play();
        //this.music.play();
        this.addBlock();
        this.scoreContainer.innerHTML = '0';
        this.Score=0;
        break;
      case this.STATES.PLAYING: 
        this.stage.sound2.play();
        this.addBlock();
        break;
      case this.STATES.ENDED:
        this.stage.sound.pause();
        this.SKYCLR=this.Clonearr(this.SKYCLR1);
        this.BgStart=0;
        this.stage.renderer.setClearColor(this.SKYCLR[0], 1); 
        this.stage.scene.background = this.stage.ListBg[this.BgStart];
        if(this.Score>this.HScore){this.HScore=this.Score;}
        this.highscorecotainer.innerHTML = this.HScore;
        this.blocks.forEach(block => {
          this.stage.remove(block.mesh);
        })
        this.blocks = [];
        this.addBlock();
        this.setState(this.STATES.READY);
        break;
      default:
        break;
    }
  }

  addBlock() {
    let lastBlock = this.blocks[this.blocks.length - 1];
    const lastToLastBlock = this.blocks[this.blocks.length - 2];
    
    if (lastBlock && lastToLastBlock) {
      const { axis, dimensionAlongAxis } = lastBlock.getAxis();
      const distance = lastBlock.position[axis] - lastToLastBlock.position[axis];
      let position, dimension;
      let positionFalling, dimensionFalling;
      const { color } = lastBlock;
      const newLength = lastBlock.dimension[dimensionAlongAxis] - Math.abs(distance); 
      if (newLength <= 0) {
        
        this.stage.sound3.play();
        this.stage.sound.stop();
        this.stage.remove(lastBlock.mesh);
        this.setState(this.STATES.ENDED);
        this.music.pause();
        return;
      }

      dimension = { ...lastBlock.dimension }
      dimension[dimensionAlongAxis] = newLength;

      dimensionFalling = { ...lastBlock.dimension }
      dimensionFalling[dimensionAlongAxis] = Math.abs(distance)

      if (distance >= 0) {
        position = lastBlock.position;

        positionFalling = { ...lastBlock.position };
        positionFalling[axis] = lastBlock.position[axis] + newLength;
      } else {
        position = { ...lastBlock.position };
        position[axis] = lastBlock.position[axis] + Math.abs(distance);

        positionFalling = { ...lastBlock.position };
        positionFalling[axis] = lastBlock.position[axis] - Math.abs(distance);
      }

      this.blocks.pop();
      this.stage.remove(lastBlock.mesh);
      lastBlock = new Block({ dimension, position, color, axis }, true);

      this.blocks.push(lastBlock);
      this.stage.add(lastBlock.mesh);
      
      const fallingBlock = new FallingBlock({
        dimension: dimensionFalling,
        position: positionFalling,
        color,
      });

      this.fallingBlocks.push(fallingBlock);
      this.stage.add(fallingBlock.mesh);
    }
    
    const newBlock = new Block(lastBlock);
    
    this.startcolor+=2;
    if(this.startcolor>this.endcolor){this.startcolor = 0}
    newBlock.material.color.setHSL(this.startcolor/100,1,0.6 );
    newBlock.color= newBlock.material.color;
    
    this.stage.add(newBlock.mesh);
    this.blocks.push(newBlock);
    this.stage.setCamera(this.blocks.length * 2);
    if(this.blocks.length%5==0){
      this.SKYCLR.push(this.SKYCLR.shift()); 
      this.BgStart++;
      if(this.BgStart>=this.BgFinish){this.BgStart=0;}
      this.stage.renderer.setClearColor(this.SKYCLR[0], 1); 
      this.stage.scene.background = this.stage.ListBg[this.BgStart];
		  this.Score+=5;
      this.scoreContainer.innerHTML = this.Score;
    }else{
      this.Score++;
      this.scoreContainer.innerHTML = this.Score;
    }
  }  
  hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  setState(state) {
    const oldState = this.state;
    this.mainContainer.classList.remove(this.state);
    this.state = state;
    this.mainContainer.classList.add(this.state);
    return oldState;
  }
  tick() {
    if (this.blocks.length > 1) {
      this.blocks[this.blocks.length - 1].tick(this.blocks.length/10);
    }
    this.fallingBlocks.forEach(block => block.tick());
    this.fallingBlocks = this.fallingBlocks.filter(block => {
      if (block.position.y > 0) {
        return true;
      } else {
        this.stage.remove(block.mesh);
        return false;
      }
    });
    this.stage.render();
    requestAnimationFrame(() => {this.tick()});
  }
  Clonearr(value){
    let aa =[];
    for(let i =0;i<value.length;i++){
        if(value[i]){
            aa.push(value[i]);
        }else{
            aa.push(0);
        }
    }
    return aa;
}
  addbackground(){
    let game=this;
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( '/asset/sound/free.mp3', function( buffer ) {
      game.stage.sound.setBuffer( buffer );
      game.stage.sound.setLoop( true );
      game.stage.sound.setVolume( 0.3 );
    });  
    
    audioLoader.load( '/asset/sound/check.mp3', function( buffer ) {
      game.stage.sound2.setBuffer( buffer );
      game.stage.sound2.setLoop( false );
      game.stage.sound2.setVolume( 0.5 );
    });
    audioLoader.load( '/asset/sound/gameover.mp3', function( buffer ) {
      game.stage.sound3.setBuffer( buffer );
      game.stage.sound3.setLoop( false );
      game.stage.sound3.setVolume( 0.5 );
    });
  }
}

module.exports = Game;
