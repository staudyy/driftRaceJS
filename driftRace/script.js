// SETTINGS

// TODO (low priority)
// Fix collision with walls friction and stuff
// Make tanks not push each other (settable)
// Make shot balls not pass through walls
// Fix maze generation (no overlap)
// Add mobile controls somehow


//NEW STUFF
var LAPS = 3
var DEF_ACCELERATION = 0.08  //Works weird??
var ROTATION_SPEED = 2.5
var DEF_WALL_THICKNESS = 15
var DEF_TANK_SIZE = 45

// Needed const
const ROTATION_SPEED_RAD = ROTATION_SPEED * (Math.PI/180)

// to engine
var DEF_GRAVITY = 0
var DEF_GRAVITY_X = 0
var BOUNCINESS = 0
var FRICTION = 0.01
var FRICTION_STATIC = 0.1
var FRICTION_AIR = 0.005
var RESTING = 0.1  //autism jednotka proste cim menej tym presnejsie bounces default: 4
var POSITION_ITER = 30  //makes stacking more stable, default: 6

// Colors
const BG_COLOR = 0xebac54
const PADDING_COLOR = 0x4a4640
const WALL_COLOR = 0x000000
const BUTTON_COLOR = 0x701340
const BUTTON_HOVER_COLOR = 0x991153
const FINISH_COLOR =0x3bdc56

// Changeable
var GAME_SIDES_RATIO = 1.5  // 0.5;  WIDTH : HEIGHT (1 = square) -> WIDTH == 0.5*HEIGHT

const PADDING_TOP_RATIO = 1/20
const PADDING_BOTTOM_RATIO = 1/15
const PADDING_SIDES_RATIO = 1/20



//Calculate needed constants
//need recount
let DPR
let WIDTH
let HEIGHT

let SCALE_RATIO

let FIXED_PADDING_TOP
let FIXED_PADDING_BOTTOM
let FIXED_PADDING_SIDE

let MIN_GAME_WIDTH
let MIN_GAME_HEIGHT


let PADDING_TOP
let PADDING_BOTTOM
let PADDING_SIDE

let GAME_WIDTH
let GAME_HEIGHT

let GAME_SCALE_RATIO

let MAX_QUEUE_HEIGHT
let GAME_LINE_HEIGHT
let FRUIT_SPAWN_PADDING

let ACCELERATION
let MAX_SPEED
let BULLET_SIZE
let BULLET_SPEED
let WALL_THICKNESS
let TANK_SIZE

let DIAMETERS
let GRAVITY
let GRAVITY_X

let FONT
let COLORS

function recount_scaleable() {
    // Part 1 of calculations
    DPR = window.devicePixelRatio
    WIDTH = window.innerWidth * DPR
    HEIGHT = window.innerHeight * DPR

    SCALE_RATIO = HEIGHT / 1000

    FIXED_PADDING_TOP = HEIGHT * PADDING_TOP_RATIO
    FIXED_PADDING_BOTTOM = HEIGHT * PADDING_BOTTOM_RATIO
    FIXED_PADDING_SIDE = WIDTH * (PADDING_SIDES_RATIO / 2)

    MIN_GAME_WIDTH = WIDTH - 2 * FIXED_PADDING_SIDE
    MIN_GAME_HEIGHT = HEIGHT - FIXED_PADDING_TOP - FIXED_PADDING_BOTTOM

    // Game ratio stuff
    if (MIN_GAME_WIDTH >= GAME_SIDES_RATIO * MIN_GAME_HEIGHT) {  //Too wide
        PADDING_TOP = FIXED_PADDING_TOP
        PADDING_BOTTOM = FIXED_PADDING_BOTTOM
        PADDING_SIDE = FIXED_PADDING_SIDE + (MIN_GAME_WIDTH - GAME_SIDES_RATIO * MIN_GAME_HEIGHT) / 2
    
    } else {  //Too high (WIDTH < RATIO*HEIGHT)
        PADDING_TOP = FIXED_PADDING_TOP + (MIN_GAME_HEIGHT - MIN_GAME_WIDTH / GAME_SIDES_RATIO) / 2
        PADDING_BOTTOM = FIXED_PADDING_BOTTOM + (MIN_GAME_HEIGHT - MIN_GAME_WIDTH / GAME_SIDES_RATIO) / 2
        PADDING_SIDE = FIXED_PADDING_SIDE
    }
    
    GAME_WIDTH = WIDTH - 2 * PADDING_SIDE
    GAME_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    
    GAME_SCALE_RATIO = GAME_HEIGHT / 1000
    
    // MAX_QUEUE_HEIGHT = 55 * SCALE_RATIO
    // GAME_LINE_HEIGHT = PADDING_TOP + GAME_SCALE_RATIO * 150
    // FRUIT_SPAWN_PADDING = 10 * GAME_SCALE_RATIO

    // // Colors
    // COLORS = []
    // for (let i = 0; i < DIAMETERS.length; i++) {
    //     COLORS.push(getRandomColor())
    // }

    // Gravity
    GRAVITY = DEF_GRAVITY*GAME_SCALE_RATIO
    GRAVITY_X = DEF_GRAVITY_X*GAME_SCALE_RATIO

    // Font
    FONT = {
        fontSize: 25*SCALE_RATIO,
        fontFamily: 'LocalComicSans, Comic Sans MS, Comic Sans, Verdana, serif',
        color: "white"
    }

    ACCELERATION = DEF_ACCELERATION * GAME_SCALE_RATIO
    WALL_THICKNESS = DEF_WALL_THICKNESS * GAME_SCALE_RATIO
    TANK_SIZE = DEF_TANK_SIZE * GAME_SCALE_RATIO
}

recount_scaleable()


function windowResize() {
    // recount disabled cuz nechcem forcovat restart
    // recount_scaleable()
    game.scale.setGameSize(WIDTH, HEIGHT)
    game.scale.displaySize.resize(WIDTH, HEIGHT);

    // game.scene.scenes.forEach((scene) => {
    //     const key = scene.scene.key;
    //     game.scene.stop(key);
    // })
    // game.scene.start('Menu');
}

function randint(start, stop) {
    return Math.floor(Math.random() * (stop - start + 1)) + start;
}

function getRandomColor() {
    var letters = '23456789ABCD';
    var color = '0x';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}


class Track {
    constructor(data) {
        this.objects = data.objects
        this.matter_obj = data.matter_obj
        this.checkpoints = []

        this.draw(data.scene, data.matter_obj, data.start_x, data.start_y, data.thickness)
    }

    draw(scene, matter_obj, start_x, start_y, thickness) {
        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i]
            
            if (object.type == "wall") {
                let phaser_object = scene.add.rectangle (
                    start_x + object.x * GAME_SCALE_RATIO,
                    start_y + object.y * GAME_SCALE_RATIO,
                    object.length * GAME_SCALE_RATIO, thickness,
                    WALL_COLOR
                )
                let wall = scene.matter.add.gameObject(phaser_object, matter_obj)
                wall.setAngle(object.angle)
            }
            else if (object.type == "finish") {
                let phaser_object = scene.add.rectangle (
                    start_x + object.x * GAME_SCALE_RATIO,
                    start_y + object.y * GAME_SCALE_RATIO,
                    object.length * GAME_SCALE_RATIO, thickness,
                    FINISH_COLOR
                )
                let current_matter_obj = {
                    label: 'Finish',
                    isStatic: true,
                    isSensor: true,
                    shape: {
                        type: 'rectangle'
                    },
                }
                let finish = scene.matter.add.gameObject(phaser_object, current_matter_obj)
                finish.setAngle(object.angle)
            }
            else if (object.type == "checkpoint") {
                let phaser_object = scene.add.rectangle (
                    start_x + object.x * GAME_SCALE_RATIO,
                    start_y + object.y * GAME_SCALE_RATIO,
                    object.length * GAME_SCALE_RATIO, thickness,
                    BG_COLOR
                )
                let current_matter_obj = {
                    label: 'Checkpoint',
                    isStatic: true,
                    isSensor: true,
                    shape: {
                        type: 'rectangle'
                    },
                }
                let checkpoint = scene.matter.add.gameObject(phaser_object, current_matter_obj)
                checkpoint.setAngle(object.angle)
                this.checkpoints.push(checkpoint)
            }


        }
    }
}


class Tank {
    constructor(data) {
        this.scene = data.scene

        let tank1obj = this.scene.add.sprite(data.x, data.y, data.sprite)

        this.tank = this.scene.matter.add.gameObject(tank1obj, data.physics_obj)
        this.tank.setScale(data.size / 1000)
        this.height = this.tank.height * (data.size / 1000)
        this.width = this.tank.width * (data.size / 1000)

        // Register Controls
        this.key_up = this.scene.input.keyboard.addKey(data.controls.up);
        this.key_down = this.scene.input.keyboard.addKey(data.controls.down);
        this.key_left = this.scene.input.keyboard.addKey(data.controls.left);
        this.key_right = this.scene.input.keyboard.addKey(data.controls.right);

        // Save checkpoint data
        this.tank.checkpoints = data.checkpoints
        this.tank.current_checkpoint = 0
        this.tank.lap_finished = false

        this.tank.setOnCollide(this.collision)
    }

    update() {
        if (!this.tank.active) {
            return
        }

        // this.tank.setFrictionAir(FRICTION_AIR)
        let key_pressed = false
        if(this.key_up.isDown) {
            key_pressed = true
            // this.tank.setFrictionAir(0)
            
            let new_vel_x = this.tank.body.velocity.x + ACCELERATION * Math.sin(this.tank.rotation)
            let new_vel_y = this.tank.body.velocity.y - ACCELERATION * Math.cos(this.tank.rotation)
            this.tank.setVelocity(new_vel_x, new_vel_y)
            
            // if (new_vel_x**2 + new_vel_y**2 < MAX_SPEED**2) {
            //     this.tank.setVelocity(new_vel_x, new_vel_y)
            // } else {
            //     this.tank.setVelocity(MAX_SPEED * Math.sin(this.tank.rotation), - MAX_SPEED * Math.cos(this.tank.rotation))
            //     TODO
            // }
            
        }
        else if(this.key_down.isDown) {
            key_pressed = true
            // this.tank.setFrictionAir(0)

            let new_vel_x = this.tank.body.velocity.x - ACCELERATION/2 * Math.sin(this.tank.rotation)
            let new_vel_y = this.tank.body.velocity.y + ACCELERATION/2 * Math.cos(this.tank.rotation)
            this.tank.setVelocity(new_vel_x, new_vel_y)

            // if (new_vel_x**2 + new_vel_y**2 < MAX_SPEED**2) {
            //     this.tank.setVelocity(new_vel_x, new_vel_y)
            // } else {
            //     this.tank.setVelocity(- MAX_SPEED * Math.sin(this.tank.rotation), MAX_SPEED * Math.cos(this.tank.rotation))
            //     TODO
            // }
        }

        if(this.key_left.isDown) {
            key_pressed = true
            this.tank.setAngle(this.tank.angle - ROTATION_SPEED)
            // this.tank.setVelocity(
            //     this.tank.body.velocity.x * Math.cos(-ROTATION_SPEED_RAD) - this.tank.body.velocity.y * Math.sin(-ROTATION_SPEED_RAD),
            //     this.tank.body.velocity.x * Math.sin(-ROTATION_SPEED_RAD) + this.tank.body.velocity.y * Math.cos(-ROTATION_SPEED_RAD)
            // )
        }
        else if(this.key_right.isDown) {
            key_pressed = true
            this.tank.setAngle(this.tank.angle + ROTATION_SPEED)
            // this.tank.setVelocity(
            //     this.tank.body.velocity.x * Math.cos(ROTATION_SPEED_RAD) - this.tank.body.velocity.y * Math.sin(ROTATION_SPEED_RAD),
            //     this.tank.body.velocity.x * Math.sin(ROTATION_SPEED_RAD) + this.tank.body.velocity.y * Math.cos(ROTATION_SPEED_RAD)
            // )
        }

        if(key_pressed) {
            // this.tank1.setFrictionAir(0)
        } else {
            // this.tank1.setFrictionAir(FRICTION_AIR)
        }
    }

    collision(event) {
        if (event.bodyA.label == "BodyWall" || event.bodyB.label == "BodyWall") {
            this.gameObject.setVelocity(0, 0)
        }
        if (event.bodyA.label == "Checkpoint") {
            if (this.gameObject.current_checkpoint >= this.gameObject.checkpoints.length) {
                return
            }

            if (event.bodyA.id == this.gameObject.checkpoints[this.gameObject.current_checkpoint].body.id) {
                this.gameObject.current_checkpoint += 1
            }
        }
        if (event.bodyA.label == "Finish") {
            if (this.gameObject.current_checkpoint >= this.gameObject.checkpoints.length) {
                this.gameObject.current_checkpoint = 0
                this.gameObject.lap_finished = true
            }
        }
    }


}



class NumberInput {
    constructor (scene, x, y, width, height, min=null, max=null, step="any") {
        this.input_object = scene.add.dom(x, y).createFromHTML(this.getInputString(width, height, step))
        if (min != null) {
            this.setMin(min)
        }
        if (max != null) {
            this.setMax(max)
        }
    }

    setMin(value) {
        this.input_object.getChildByName("myInput").min = value
    }

    setMax(value) {
        this.input_object.getChildByName("myInput").max = value
    }

    getInputString(width, height, step) {
        return `
            <input type="number" name="myInput" placeholder="Value" step="${step}" style="${this.getInputStyle(width, height)}"/>
        `
    }

    getInputStyle(width, height) {
        return `
                font-size: ${FONT.fontSize}px;
                width: ${width}px;
                height: ${height}px;
                padding: 0px;
                text-indent: 10px;
        `
        .replace(/\s+/g, '') // Remove whitespaces
    }

    getVal() {
        let html_obj = this.input_object.getChildByName("myInput")
        if(html_obj.value != "") {
            return Number(html_obj.value)
        } else {
            return null
        }
    }

    setVal(value) {
        let html_obj = this.input_object.getChildByName("myInput")
        html_obj.value = value
    }

    destroy() {
        this.input_object.destroy()
    }
}


class MyScene extends Phaser.Scene {
    constructor(arg) {
        super(arg)
    }

    create_button(x, y, width, height, text, callback, color=BUTTON_COLOR, hover_color=BUTTON_HOVER_COLOR) {
        this.add.rectangle(x, y, width, height, color)
        .setInteractive({cursor: "pointer"})
        .on('pointerup', () => callback.call(this))
        .on('pointerover', function() {this.setFillStyle(hover_color)})
        .on('pointerout', function() {this.setFillStyle(color)});
        
        this.add.text(x, y, text, FONT).setOrigin(0.5)
    }

    create_input(x, y, width, height, min=null, max=null, step="any") {
        return new NumberInput(this, x, y, width, height, min, max, step)
    }
}


class Menu extends MyScene {
    constructor () {
        super("Menu")
    }

    create () {
        this.add.text(Math.floor(WIDTH/2), 80*SCALE_RATIO, "Drift Race", FONT)
        .setOrigin(0.5)
        .setFontSize(70*SCALE_RATIO)
        .setWordWrapWidth(WIDTH)

        this.add.text(Math.floor(WIDTH/4), HEIGHT/4, "Player 1 (Red)\nWASD", FONT)
        .setOrigin(0.5)
        .setFontSize(40*SCALE_RATIO)
        .setAlign("center")
        .setColor(" #eb3434")
        .setWordWrapWidth(WIDTH/2 - 5*SCALE_RATIO)

        this.add.text(WIDTH - Math.floor(WIDTH/4), HEIGHT/4, "Player 2 (Green)\n↑←↓→", FONT)
        .setOrigin(0.5)
        .setFontSize(40*SCALE_RATIO)
        .setAlign("center")
        .setColor(" #48ff4b")
        .setWordWrapWidth(WIDTH/2 - 5*SCALE_RATIO)

        this.create_button(WIDTH/2, HEIGHT/2 - 60*SCALE_RATIO, 200*SCALE_RATIO, 95*SCALE_RATIO, "PLAY", function(){
            this.scene.start("Game")
        })

        this.create_button(WIDTH/2, HEIGHT/2 + 60*SCALE_RATIO, 200*SCALE_RATIO, 95*SCALE_RATIO, "SETTINGS", function(){
            this.scene.start("Settings")
        })

        this.add.text(Math.floor(WIDTH/2), HEIGHT - 100*SCALE_RATIO, "-For 2 players!\n-Highly customizable!\n-Works only with a keyboard\n-After resizing the page reload it to fix visual issues", FONT)
        .setOrigin(0.5)
        .setFontSize(22*SCALE_RATIO)
        .setWordWrapWidth(WIDTH - 70*SCALE_RATIO)
    }
}

class Settings extends MyScene {
    constructor() {
        super("Settings")
    }

    create () {
        function save_data() {
            for (let i = 0; i < settings_setup.length; i++) {
                if (settings_setup[i].input.getVal() != null) {
                    window[settings_setup[i].name] = settings_setup[i].input.getVal()
                }
            }
            recount_scaleable()
        }

        this.add.text(Math.floor(WIDTH/2), 50*SCALE_RATIO, "Settings", FONT).setOrigin(0.5).setFontSize(45*SCALE_RATIO)
        this.add.text(WIDTH - WIDTH/6, 50*SCALE_RATIO, "*Changing these might make the game unplayable :)", FONT)
        .setOrigin(0.5)
        .setFontSize(15*SCALE_RATIO)
        .setWordWrapWidth(WIDTH/4)

        this.create_button(80*SCALE_RATIO, 50*SCALE_RATIO, 130*SCALE_RATIO, 55*SCALE_RATIO, "Home", function(){
            save_data()
            this.scene.start("Menu")
        })

        let settings_setup = [
            {
                name: "DEF_ACCELERATION",
                val: DEF_ACCELERATION,
                text: "Car Acceleration",
                input: null
            },
            {
                name: "ROTATION_SPEED",
                val: ROTATION_SPEED,
                text: "Car Rotation Speed",
                input: null
            },
            {
                name: "LAPS",
                val: LAPS,
                text: "Laps To Win",
                input: null
            },
            {
                name: "FRICTION_AIR",
                val: FRICTION_AIR,
                text: "Air Friction (Drag)",
                input: null
            },
            {
                name: "DEF_WALL_THICKNESS",
                val: DEF_WALL_THICKNESS,
                text: "Wall Thickness",
                input: null
            },
            {
                name: "DEF_TANK_SIZE",
                val: DEF_TANK_SIZE,
                text: "Car Size",
                input: null
            }
        ]
        const OFFSET = 65
        const START = 150
        for (let i = 0; i < settings_setup.length; i++) {
            this.add.text(10*SCALE_RATIO, START*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), settings_setup[i].text, FONT)
            .setWordWrapWidth(WIDTH/2)
            .setFontSize(18*SCALE_RATIO)
            .setOrigin(0, 0.5)

            settings_setup[i].input = this.create_input(WIDTH / 2 + 50*SCALE_RATIO, START*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), 82*SCALE_RATIO, 42*SCALE_RATIO)
            settings_setup[i].input.setVal(settings_setup[i].val)
            this.add.line(0, 0, 10*SCALE_RATIO, (START + 35)*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), WIDTH - 10*SCALE_RATIO, (START + 35)*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), 0xffffff)
            .setOrigin(0)
        }


    }
}

class LoseOverlay extends MyScene {
    constructor() {
        super("LoseOverlay")
    }

    create(args) {
        this.add.rectangle(WIDTH/2, HEIGHT/2, 250*SCALE_RATIO, 300*SCALE_RATIO, PADDING_COLOR).setAlpha(0.7)
        
        // this.add.text(WIDTH/2, HEIGHT/2 - 100*SCALE_RATIO, "Game Over", FONT).setOrigin(0.5).setFontSize(40*SCALE_RATIO)
        // this.add.text(WIDTH/2, HEIGHT/2 - 40*SCALE_RATIO, "Score: " + args.score, FONT).setOrigin(0.5)

        this.add.text(WIDTH/2, HEIGHT/2 - 80*SCALE_RATIO, args.winner_name + " wins!", FONT).setOrigin(0.5).setFontSize(40*SCALE_RATIO)
        // this.add.text(WIDTH/2, HEIGHT/2 - 40*SCALE_RATIO, `Red: ${score[0]} — Blue: ${score[1]}`, FONT).setOrigin(0.5)

        this.create_button(WIDTH/2, HEIGHT/2 + 30*SCALE_RATIO, 150*SCALE_RATIO, 55*SCALE_RATIO, "Restart", function() {
            this.scene.start("Game")
        })

        this.create_button(WIDTH/2, HEIGHT/2 + 100*SCALE_RATIO, 150*SCALE_RATIO, 55*SCALE_RATIO, "Menu", function() {
            game.scene.stop("Game")
            this.scene.start("Menu")
        })
    }
}

class GameScene extends MyScene {
    constructor () {
        super("Game")
    }

    reset_variables() {
        //set gravity
        this.matter.world.setGravity(GRAVITY_X, GRAVITY)

        this.score_text;
        this.score = [0, 0]

        this.default_tank_physics = {
            label: 'BodyTank',
            shape: {
                type: 'rectangle'
            },
            chamfer: null,
        
            isStatic: false,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: BOUNCINESS, // 0
            friction: FRICTION, // 0.1
            frictionStatic: FRICTION_STATIC, // 0.5
            frictionAir: FRICTION_AIR, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        },

        this.default_wall_physics = {
            label: 'BodyWall',
            shape: {
                type: 'rectangle'
            },
            chamfer: null,
        
            isStatic: true,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: 0, // 0
            friction: 10, // 0.1
            frictionStatic: 0, // 0.5
            frictionAir: 0, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        }
    }
    
    preload ()
    {
        this.reset_variables()
        this.load.image('car_red', 'assets/car_red.png');
        this.load.image('car_green', 'assets/car_green.png');
    }

    create ()
    {
        // Fix sudden stop of bouncing
        Phaser.Physics.Matter.Matter.Resolver._restingThresh = RESTING; // default is 4

        //Make stacking more stable
        this.matter.world.engine.positionIterations = POSITION_ITER;  // default is 6

        // Set world bounds
        this.matter.world.setBounds(PADDING_SIDE, PADDING_TOP, WIDTH - PADDING_SIDE*2, HEIGHT - PADDING_BOTTOM - PADDING_TOP, 1500);
        // this.matter.world.setBounds(0, 0, 800, 600, 500);

        // Create top and bottom rectangles
        this.add.rectangle(0, 0, WIDTH, PADDING_TOP, PADDING_COLOR).setOrigin(0)
        this.add.rectangle(0, HEIGHT - PADDING_BOTTOM, WIDTH, HEIGHT, PADDING_COLOR).setOrigin(0)

        // Create side rectangles
        this.add.rectangle(0, 0, PADDING_SIDE, HEIGHT, PADDING_COLOR).setOrigin(0)
        this.add.rectangle(WIDTH - PADDING_SIDE, 0, PADDING_SIDE, HEIGHT, PADDING_COLOR).setOrigin(0)

        // Create a home button
        this.create_button(WIDTH - Math.max(PADDING_SIDE, 10*SCALE_RATIO) - 60*SCALE_RATIO, 25*SCALE_RATIO, 120*SCALE_RATIO, 40*SCALE_RATIO, "Home", function(){
            this.scene.start("Menu")
        })

        // Add score texts
        this.score_text = this.add.text(Math.max(10*SCALE_RATIO, PADDING_SIDE), 25*SCALE_RATIO, `Red: ${this.score[0]} — Green: ${this.score[1]}`, FONT)
        .setOrigin(0, 0.5)



        // WIDTH: 1000
        // HEIGHT: 1000
        const TRACK_OBJECTS = [
            {
                type: "finish",
                x: 750,
                y: 200,
                length: 300,
                angle: 90
            },

            {
                type: "checkpoint",
                x: 250,
                y: 500,
                length: 400,
                angle: 0
            },
            {
                type: "checkpoint",
                x: 750,
                y: 800,
                length: 300,
                angle: 90
            },
            {
                type: "checkpoint",
                x: 1250,
                y: 500,
                length: 400,
                angle: 0
            },



            {
                type: "wall",
                x: 1500/2,
                y: 50,
                length: 1000,
                angle: 0
            },
            {
                type: "wall",
                x: 1500/2,
                y: 350,
                length: 400,
                angle: 0
            },

            {
                type: "wall",
                x: 1500/2,
                y: 950,
                length: 1000,
                angle: 0
            },
            {
                type: "wall",
                x: 1500/2,
                y: 650,
                length: 400,
                angle: 0
            },

            {
                type: "wall",
                x: 50,
                y: 1000/2,
                length: 1000*0.5,
                angle: 90
            },
            {
                type: "wall",
                x: 1450,
                y: 1000/2,
                length: 1000*0.5,
                angle: 90
            },

            {
                type: "wall",
                x: 500,
                y: 400,
                length: 150,
                angle: -45
            },
            {
                type: "wall",
                x: 500,
                y: 600,
                length: 150,
                angle: 45
            },
            {
                type: "wall",
                x: 450,
                y: 500,
                length: 100,
                angle: 90
            },

            {
                type: "wall",
                x: 1500-500,
                y: 1000-400,
                length: 150,
                angle: -45
            },
            {
                type: "wall",
                x: 1500-500,
                y: 1000-600,
                length: 150,
                angle: 45
            },
            {
                type: "wall",
                x: 1500-450,
                y: 1000-500,
                length: 100,
                angle: 90
            },

            {
                type: "wall",
                x: 150,
                y: 150,
                length: 300,
                angle: -45
            },
            {
                type: "wall",
                x: 150,
                y: 850,
                length: 300,
                angle: 45
            },
            {
                type: "wall",
                x: 1350,
                y: 150,
                length: 300,
                angle: 45
            },
            {
                type: "wall",
                x: 1350,
                y: 850,
                length: 300,
                angle: -45
            },
        ]

        let track_data = {
            scene: this,
            objects: TRACK_OBJECTS,
            matter_obj: this.default_wall_physics,
            start_x: PADDING_SIDE,
            start_y: PADDING_TOP,
            thickness: WALL_THICKNESS
        }

        this.track = new Track(track_data)


        let tank1_data = {
            scene: this,
            x: PADDING_SIDE + GAME_WIDTH/2 + GAME_SCALE_RATIO*50,
            y: PADDING_TOP + GAME_SCALE_RATIO*150,
            size: TANK_SIZE,
            sprite: "car_red",
            physics_obj: this.default_tank_physics,
            controls: {
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            },
            checkpoints: this.track.checkpoints
        }

        let tank2_data = {
            scene: this,
            x: PADDING_SIDE + GAME_WIDTH/2 + GAME_SCALE_RATIO*50,
            y: PADDING_TOP + GAME_SCALE_RATIO*250,
            size: TANK_SIZE,
            sprite: "car_green",
            physics_obj: this.default_tank_physics,
            controls: {
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT
            },
            checkpoints: this.track.checkpoints
        }

        this.tank1 = new Tank(tank1_data)
        this.tank2 = new Tank(tank2_data)
        this.tank1.tank.setAngle(270)
        this.tank2.tank.setAngle(270)

        this.tank1.tank.setToTop()
        this.tank2.tank.setToTop()
    }

    update() {
        this.tank1.update()
        this.tank2.update()

        if (this.tank1.tank.lap_finished) {
            this.add_score(0)
            this.tank1.tank.lap_finished = false
        } else if (this.tank2.tank.lap_finished)  {
            this.add_score(1)
            this.tank2.tank.lap_finished = false
        }

        if (this.score[0] >= LAPS) {
            game.scene.pause("Game")
            let winner = "Red"
            game.scene.start("LoseOverlay", {winner_name: winner})
        }
        if (this.score[1] >= LAPS) {
            game.scene.pause("Game")
            let winner = "Green"
            game.scene.start("LoseOverlay", {winner_name: winner})
        }
    };

    add_score(i) {
        this.score[i] += 1
        this.score_text.setText(`Red: ${this.score[0]} — Green: ${this.score[1]}`)
    }

}


let config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: BG_COLOR,
    scene: [Menu, GameScene, LoseOverlay, Settings],
    physics: {
        default: 'matter',
        matter: {
            enableSleeping: false,
            gravity: { y: GRAVITY },
            debug: false,
        }
    },
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        width: WIDTH,
        height: HEIGHT,
    }
};

// Phaser stuff
let game = new Phaser.Game(config);


window.addEventListener("resize", function (event) {
    windowResize()
})