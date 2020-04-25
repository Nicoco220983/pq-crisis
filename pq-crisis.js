const { abs, floor, min, max, pow, random: rand } = Math
const { log } = console

import * as MSG from './msgame.js'
const { Game, Scene, Sprite, SpriteSheet, Anim, Text, Aud } = MSG
const { randge, range, bound } = MSG

const WIDTH = 400, HEIGHT = 600
const RUN_SPD = 400
const ANCHOR_X = .5
const ANCHOR_Y = 1

// game

class PQGame extends Game {
    constructor(...args) {
        super(...args)
        document.addEventListener("focus", () => this.pause(false))
        document.addEventListener("blur", () => this.pause(true))
        this.addPointerDownListener(pos => {
            this.pointer = pos
            this.pointerDown = true
            this.addVolumeBut()
            this.scene.trigger("click", pos)
            if (MSG.collide(this.volumeBut, pos))
                this.volumeBut.trigger("click")
        })
        this.addPointerUpListener(() => this.pointerDown = false)
        this.addPointerMoveListener(pos => this.pointer = pos)
    }
    start() {
        this.scene = new PQScene(this)
    }
    update(dt) {
        this.scene.update(dt)
    }
    draw(ctx, dt) {
        this.scene.draw(ctx, dt)
        if (this.volumeBut) this.volumeBut.draw(ctx, 0, 0, dt)
    }
    addVolumeBut() {
        this.volumeBut = new VolumeBut(this, { x: this.width - 50, y: 50 })
    }
}

// scene

class PQScene extends Scene {
    constructor(...args) {
        super(...args)
        this.state = "START"
        this.backSprites = []
        this.sprites = []
        this.start()
    }
    add(cls, kwargs) {
        const sprite = new cls(this, kwargs)
        this.sprites.push(sprite)
        return sprite
    }
    addBack(cls, kwargs) {
        const sprite = new cls(this, kwargs)
        this.backSprites.push(sprite)
        return sprite
    }
    update(dt) {
        super.update(dt)
        if (this.state == "ONGOING") {
            PQScene.updaters.forEach(fn => fn(this))
            this.backSprites.forEach(s => s.update(dt))
            this.sprites.forEach(s => s.update(dt))
            this.backSprites = this.backSprites.filter(s => !s.removed)
            this.sprites = this.sprites.filter(s => !s.removed)
            if (this.time > DURATION + 3) {
                this.finish()
            }
        }
    }
    nextImg(dt) {
        const can = super.nextImg(dt), ctx = can.getContext("2d")
        this.backSprites.forEach(s => s.draw(ctx, 0, 0, dt))
        this.sprites.sort((a, b) => a.y > b.y)
        this.sprites.forEach(s => s.draw(ctx, 0, 0, dt))
        return can
    }
    start() {
        this.state = "START"
        const introSprites = []
        const addIntro = (cls, kwargs) => introSprites.push(this.add(cls, kwargs))
        const args = {
            x: WIDTH / 2,
            font: "20px Arial",
            anchorX: .5,
            anchorY: 0
        }
        addIntro(Text, {
            ...args, y: 60,
            value: "PQ Crisis",
            font: "60px Arial",
        })
        addIntro(Text, {
            ...args, y: 130,
            value: "C'est la crise ! Achetez vite\ndes biens de première nécessité\navant la pénurie:",
            lineHeight: 30
        })
        args.anchorX = 1
        addIntro(Text, {
            ...args, x: WIDTH / 2 - 35, y: 250,
            value: "PQ:"
        })
        addIntro(Text, {
            ...args, x: args.x - 35, y: 300,
            value: "Pates:"
        })
        addIntro(Text, {
            ...args, x: args.x - 35, y: 350,
            value: "Chocolat:"
        })
        args.anchorX = .5
        args.anchorY = .5
        addIntro(Sprite, {
            ...args, y: 250,
            anim: PqAnim,
            width: 50, height: 50
        })
        addIntro(Sprite, {
            ...args, y: 300,
            anim: PatesAnim,
            width: 50, height: 50
        })
        addIntro(Sprite, {
            ...args, y: 350,
            anim: ChocoAnim,
            width: 50, height: 50
        })
        args.anchorX = 0
        args.anchorY = 0
        addIntro(Text, {
            ...args, x: args.x + 35, y: 250,
            value: "+1 point"
        })
        addIntro(Text, {
            ...args, x: args.x + 35, y: 300,
            value: "+5 point"
        })
        addIntro(Text, {
            ...args, x: args.x + 35, y: 350,
            value: "+15 point"
        })
        args.anchorX = .5
        addIntro(Text, {
            ...args, y: 550,
            value: "Touchez pour commencer"
        })
        this.on("click", () => {
            if (this.state != "START") return
            introSprites.forEach(s => makeGoDown(s, RUN_SPD))
            this.ongoing()
        })
        PQScene.starters.forEach(fn => fn(this))
    }
    ongoing() {
        this.state = "ONGOING"
        PQScene.ongoers.forEach(fn => fn(this))
        const aud = new Aud('./assets/music.mp3')
        MSG.waitLoads(aud).then(() => aud.replay({ baseVolume: .2 }))
        this.on("remove", () => aud.pause())
    }
    finish() {
        this.state = "END"
        this.hero.anim = HeroAnims.stand
        let x = WIDTH / 2
        let font = "30px Arial"
        const anchorX = .5, anchorY = 0
        this.add(Text, {
            x, y: 200,
            font, anchorX, anchorY,
            value: `SCORE: ${this.score}`
        })
        font = "20px Arial"
        let text = "Niveau: Victime du système\nAucune chance de survie\nEssaie au moins d'atteindre 1000 points"
        if (this.score >= 1000)
            text = "Niveau: Simple citoyen\nTu peux tenir 1 petite semaine\nProchain niveau: 2000"
        if (this.score >= 2000)
            text = "Niveau: Consommateur\nTu sais remplir un caddie\nProchain niveau: 4000"
        if (this.score >= 4000)
            text = "Niveau: Consom'Acteur\nTu est actif dans la consommation\nProchain niveau: 8000"
        if (this.score >= 8000)
            text = "Niveau: Guerrier\nC'est pas à toi qu'on va la faire\nProchain niveau: 12000"
        if (this.score >= 12000)
            text = "Niveau: Survivaliste\nTu peux affronter la crise sereinement\nProchain niveau: 16000"
        if (this.score >= 16000)
            text = "Niveau: Mâle/Femme alpha\nCrise ou pas, tu vas tous les écraser\nProchain niveau: 20000"
        if (this.score >= 20000)
            text = "Niveau: Instinct animal\nTu as depuis bien longtemps\narrêter de penser aux autres\nProchain niveau: 25000"
        if (this.score >= 25000)
            text = "Niveau: IronMan\nNul ne peut t'arrêter\nProchain niveau: 30000"
        if (this.score >= 30000)
            text = "Niveau: SuperMan\nTu as probablement du sang de cryptonien\nProchain niveau: 40000"
        if (this.score >= 40000)
            text = "Niveau: PQ Man\nTu ne fais qu'un avec le PQ\nProchain niveau: 50000"
        if (this.score >= 50000)
            text = "Niveau MAX ! Dieu du PQ\nTu t'épanouis pleinement dans la crise"
        this.add(Text, {
            x, y: 300,
            font, anchorX, anchorY,
            value: text,
            lineHeight: 40
        })
        this.add(Text, {
            x, y: 550,
            font, anchorX, anchorY,
            value: `Touchez pour recommencer`
        })
        this.on("click", () => {
            this.remove()
            this.game.start()
        })
    }
}
PQScene.starters = []
PQScene.ongoers = []
PQScene.updaters = []

// volume

const VOLUME_LEVEL = .3
let volumeMuted = false

MSG.setVolumeLevel(VOLUME_LEVEL)

const volumeSS = new SpriteSheet('./assets/volume.png', {
    frameWidth: 50,
    frameHeight: 50
})

const VolumeAnims = volumeSS.getFrame([0, 1]).map(f => new Anim(f))

class VolumeBut extends Sprite {
    constructor(...args) {
        super(...args)
        this.width = 50
        this.height = 50
        this.anchorX = .5
        this.anchorY = .5
        this.syncAnim()
        this.on("click", () => {
            volumeMuted = !volumeMuted
            MSG.setVolumeLevel(volumeMuted ? 0 : VOLUME_LEVEL)
            this.syncAnim()
        })
    }
    syncAnim() {
        this.anim = VolumeAnims[volumeMuted ? 1 : 0]
    }
}

// common

function makeGoDown(sprite, spd) {
    sprite.on("update", function (dt) {
        this.y += spd * dt
        if (this.y - this.height > this.scene.height)
            this.remove()
    })
}

class Notif extends Text {
    constructor(...args) {
        super(...args)
    }
    update(dt) {
        super.update(dt)
        this.y -= 20 * dt
        if (this.time > .5) this.remove()
    }
}
    Notif.prototype.anchorX = .5
    Notif.prototype.anchorY = 1

// level

const levelUpAud = new Aud('./assets/levelup.mp3')

const START_LEVEL = 1

function getNextLevelPoints(scn) {
    return 10 + (scn.level - 1) * 5
}

PQScene.ongoers.push(scn => {
    scn.level = START_LEVEL
    scn.levelPoints = 0
    scn.add(Text, {
        x: 10,
        y: 35,
        value: () => `Level: ${scn.level} (${scn.levelPoints}/${getNextLevelPoints(scn)})`
    })
})

PQScene.updaters.push(scn => {
    if (scn.levelPoints >= getNextLevelPoints(scn))
        levelUp(scn)
})

function levelUp(scn) {
    scn.level += 1
    scn.levelPoints = 0
    scn.add(Notif, {
        x: WIDTH / 2,
        y: HEIGHT / 2,
        value: "LEVEL UP",
        color: "green",
        font: "50px Arial",
        anchorX: .5,
        anchorY: .5
    })
    scn.add(MSG.Flash, {
        width: WIDTH,
        height: HEIGHT,
        rgb: "0,255,0"
    })
    levelUpAud.replay()
}

// time

const DURATION = 60

PQScene.ongoers.push(scn => {
    scn.time = 0
    scn.add(Text, {
        x: 10,
        y: 60,
        value: () => `Time: ${max(0, floor(DURATION - scn.time))}`
    })
})

// background

const DALLE_SIZE = 50

const dalleSS = new SpriteSheet('./assets/dalles.jpg', {
    frameWidth: 50,
    frameHeight: 50
})

const DalleAnims = dalleSS.getFrame(range(4)).map(i => new Anim(i))

let LastDalle

PQScene.starters.push(scn => {
    const nbDallesY = HEIGHT / DALLE_SIZE
    for (let j = nbDallesY; j >= 0; --j) {
        createDalleRow(scn, {
            y: j * DALLE_SIZE
        })
    }
})

PQScene.updaters.push(scn => {
    if (LastDalle.y > -DALLE_SIZE)
        createDalleRow(scn, {
            y: LastDalle.y - DALLE_SIZE
        })
})

function createDalleRow(scn, kwargs) {
    const nbDalles = WIDTH / DALLE_SIZE
    for (let i = 0; i < nbDalles; ++i) {
        kwargs.x = i * DALLE_SIZE
        LastDalle = createDalle(scn, kwargs)
    }
}

function createDalle(scn, kwargs) {
    const s = scn.addBack(Sprite, {
        width: DALLE_SIZE,
        height: DALLE_SIZE
    })
    s.autoTransformImg = false
    makeGoDown(s, RUN_SPD)
    Object.assign(s, kwargs)
    let anim = 0
    if (scn.level >= 3) {
        const r = Math.random()
        if (r > 1 - .01 * scn.level) anim = 2
        else if (r > 1 - .03 * scn.level) anim = 1
        if (scn.level >= 5) {
            if (r > 1 - .005 * scn.level) anim = 3
        }
    }
    s.anim = DalleAnims[anim]
    return s
}

// hero

const SPDMAX = 2000, ACC = 2000, DEC = 2000

const heroSS = new SpriteSheet('./assets/caddie.png', {
    frameWidth: 124,
    frameHeight: 200
})
const HeroAnims = {
    stand: new Anim(heroSS.getFrame(0)),
    run: new Anim(heroSS.getFrame(range(1, 5)), { fps: 12 }),
    slide: new Anim(heroSS.getFrame(5))
}

const slideAud = new Aud('./assets/screech.mp3')
const ouchAud = new Aud('./assets/ouch.mp3')

class Hero extends Sprite {
    constructor(...args) {
        super(...args)
        this.anim = HeroAnims.stand
        this.width = 50
        this.height = 80
        this.anchorX = ANCHOR_X
        this.anchorY = ANCHOR_Y
        this.dx = 0
        this.prevDx = 0
    }
}

PQScene.starters.push(scn => {
    scn.hero = scn.add(Hero, {
        x: scn.width / 2,
        y: 500
    })
    scn.hero.autoTransformImg = false
    scn.hero.damage = function (n) {
        scn.score -= n
        scn.levelPoints = 0
        scn.add(Notif, {
            x: this.x,
            y: this.y - 100,
            value: "-" + n,
            color: "red"
        })
        scn.add(MSG.Flash, {
            width: WIDTH,
            height: HEIGHT,
            rgb: "255,0,0"
        })
        ouchAud.replay()
    }
})

PQScene.ongoers.push(scn => {
    scn.hero.anim = HeroAnims.run
    scn.hero.on("update", function (dt) {
        if (scn.game.pointerDown) {
            this.dx = MSG.moveTo(this.x, scn.game.pointer.x, this.dx, SPDMAX, ACC, DEC, dt)
            if (abs(this.dx) < abs(this.prevDx) && abs(this.dx) > 250) {
                this.anim = HeroAnims.slide
                this.animFlipX = (this.dx <= 0)
                slideAud.replay({ baseVolume: .2 })
            } else {
                this.anim = HeroAnims.run
                this.animFlipX = false
            }
        } else {
            this.dx = MSG.accTo(this.dx, 0, ACC, DEC, dt)
            this.anim = HeroAnims.run
        }
        this.prevDx = this.dx
        this.x = bound(this.x + this.dx * dt, 25, WIDTH - 25)
    })
})


// score

PQScene.ongoers.push(scn => {
    scn.score = 0
    scn.add(Text, {
        x: 10,
        y: 10,
        value: () => `Score: ${scn.score}`
    })
})

// items

const PqAnim = new Anim('./assets/PQ.png')
const PatesAnim = new Anim('./assets/pates.png')
const ChocoAnim = new Anim('./assets/choco.png')

const ITEM_SIZE = 30

const itemAudPool = new MSG.AudPool(5, './assets/item.mp3')

PQScene.updaters.push(scn => {
    if (scn.time > DURATION) return
    const nextTime = scn.nextItemTime || 0
    if (scn.time > nextTime) {
        createItem(scn)
        scn.nextItemTime = scn.time + 2 / (3 + scn.level) * randge(.7, 1.3)
    }
    const nextSerieTime = scn.nextItemSerieTime || 0
    if (scn.time > nextSerieTime) {
        createItemSerie(scn)
        scn.nextItemSerieTime = scn.time + 12 / (3 + scn.level) * randge(.7, 1.3)
    }
})

function createItemSerie(scn) {
    const dsize = ITEM_SIZE / 2
    const nb = floor(randge(3, 3 + scn.level))
    const x1 = randge(dsize, WIDTH - dsize)
    const x2 = randge(max(dsize, x1 - 50 * nb), min(WIDTH - dsize, x1 + 50 * nb))
    for (let i = 0; i < nb; ++i) {
        let type = "pq"
        if (i == nb - 1)
            type = (rand() > .5) ? "choco" : "pates"
        const x = x1 + (x2 - x1) * i / (nb - 1)
        const y = - ITEM_SIZE * i * 1.5
        createItem(scn, { x, y, type })
    }
}

function createItem(scn, kwargs) {
    const dsize = ITEM_SIZE / 2
    let x = kwargs && kwargs.x
    if (x === undefined) x = dsize + rand() * (WIDTH - dsize)
    let y = kwargs && kwargs.y
    if (y === undefined) y = 0
    let type = kwargs && kwargs.type
    if (type === undefined) {
        type = "pq"
        const r = rand()
        if (r > .8 + .15 * 3 / (2 + scn.level)) type = "choco"
        else if (r > .6 + .3 * 3 / (2 + scn.level)) type = "pates"
    }
    let anim, score, name
    switch (type) {
        case "pq":
            score = 1
            name = "PQ"
            anim = PqAnim
            break
        case "pates":
            score = 5
            name = "Pates"
            anim = PatesAnim
            break
        case "choco":
            score = 15
            name = "Chocolat"
            anim = ChocoAnim
            break
    }
    const s = scn.add(Sprite, {
        x,
        y,
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        anchorX: ANCHOR_X,
        anchorY: ANCHOR_Y,
        anim,
        type,
        name,
        score
    })
    s.autoTransformImg = false
    makeGoDown(s, RUN_SPD)
    s.on("update", function () {
        if (MSG.collide(scn.hero, this))
            this.collide()
    })
    s.collide = function () {
        this.remove()
        const addScore = this.score * pow(2, scn.level - 1)
        scn.score += addScore
        scn.levelPoints += 1
        scn.add(Notif, {
            x: this.x,
            y: this.y - 30,
            value: `${this.name}: +${addScore}`,
            color: "green"
        })
        itemAudPool.next().replay({ baseVolume: .2 })
    }
}


// enemy: etagere

const ETAGERE_NBX = 6

const etagAnim = new Anim('./assets/etagere.png')

PQScene.updaters.push(scn => {
    if (scn.time > DURATION) return
    const nextTime = scn.nextEtagereTime || 0
    if (scn.time > nextTime) {
        createEtagereRow(scn)
        scn.nextEtagereTime = scn.time + 1
    }
})

function createEtagereRow(scn) {
    let n = 0
    const r = rand()
    if (scn.level >= 2 && r > .6 + .4 / scn.level) n = 1
    if (scn.level >= 6 && r > .9 + .1 / scn.level) n = 2
    let xi = 0
    if (rand() < .5) xi = ETAGERE_NBX - 1 - n
    createEtagere(scn, { x: 0 })
    createEtagere(scn, { x: WIDTH })
    for (let i = 0; i < n; ++i) {
        createEtagere(scn, {
            x: (1 + xi + i) * WIDTH / ETAGERE_NBX
        })
    }
}

function createEtagere(scn, kwargs) {
    const self = scn.add(Sprite, {
        x: kwargs.x,
        y: 0,
        width: WIDTH / ETAGERE_NBX,
        height: WIDTH / ETAGERE_NBX * 2,
        anchorX: ANCHOR_X,
        anchorY: ANCHOR_Y,
        anim: etagAnim,
        score: 5
    })
    self.autoTransformImg = false
    makeGoDown(self, RUN_SPD)
    self.on("update", function () {
        if (!this.collided && this.collidesWith(scn.hero)) {
            this.onCollide()
        }
    })
    self.collidesWith = function (obj) {
        const b = this.getBoundaries()
        return MSG.collide(obj, {
            x: b.x + 5,
            width: b.width - 10,
            y: b.y + 115,
            height: b.height - 120
        })
    }
    self.onCollide = function () {
        this.collided = true
        scn.hero.damage(this.score)
    }
}


// enemy: rival

PQScene.updaters.push(scn => {
    if (scn.time > DURATION || scn.level < 3) return
    const nextTime = scn.nextRivalTime || 0
    if (scn.time > nextTime) {
        createRival(scn)
        scn.nextRivalTime = scn.time + 3 + 2 * rand()
    }
})

function createRival(scn) {
    const rival = scn.add(Sprite, {
        x: 25 + rand() * (WIDTH - 25),
        y: 0,
        anim: HeroAnims.run,
        width: 50,
        height: 80,
        anchorX: ANCHOR_X,
        anchorY: ANCHOR_Y,
        dx: rand() * 100 - 50,
        score: 5
    })
    rival.autoTransformImg = false
    makeGoDown(rival, RUN_SPD / 2)
    rival.on("update", function (dt) {
        this.x += this.dx * dt
        if ((this.x < (this.width / 2) && this.dx < 0) || (this.x > (WIDTH - this.width / 2) && this.dx > 0)) {
            this.dx = - this.dx
        }
        if (!this.collided && this.collidesWith(scn.hero)) {
            this.onCollide()
        }
    })
    rival.collidesWith = function (obj) {
        const b = this.getBoundaries()
        return MSG.collide(obj, {
            x: b.x + 10,
            width: b.width - 20,
            y: b.y + 55,
            height: b.height - 60
        })
    }
    rival.onCollide = function () {
        this.collided = true
        scn.hero.damage(this.score)
    }
}


// enemy: flame

const FLAME_SIZE = 40

const flameSS = new SpriteSheet('./assets/flame.png', {
    frameWidth: 40,
    frameHeight: 80
})

const flameAnims = new Anim(flameSS.getFrame(range(4)), { fps: 10 })

PQScene.updaters.push(scn => {
    if (scn.time > DURATION || scn.level < 5) return
    const nextTime = scn.nextFlameTime || 0
    if (scn.time > nextTime) {
        createFlame(scn)
        scn.nextFlameTime = scn.time + 2 / (scn.level - 3) * randge(.7, 1.3)
    }
})

function createFlame(scn) {
    const flame = scn.add(Sprite, {
        x: FLAME_SIZE / 2 + rand() * (WIDTH - FLAME_SIZE / 2),
        y: 0,
        anim: flameAnims,
        width: FLAME_SIZE,
        height: FLAME_SIZE * 2,
        anchorX: ANCHOR_X,
        anchorY: ANCHOR_Y,
        score: 10
    })
    flame.autoTransformImg = false
    makeGoDown(flame, RUN_SPD)
    flame.on("update", function () {
        if (!this.collided && this.collidesWith(scn.hero)) {
            this.onCollide()
        }
    })
    flame.collidesWith = function (obj) {
        const b = this.getBoundaries()
        return MSG.collide(obj, {
            x: b.x + 5,
            width: b.width - 10,
            y: b.y + 65,
            height: b.height - 70
        })
    }
    flame.onCollide = function () {
        this.collided = true
        scn.hero.damage(this.score)
    }
}

// start

const canvas = MSG.createCanvas(WIDTH, HEIGHT, { fitWindow: true })
document.body.appendChild(canvas)
const game = new PQGame(canvas)
game.initLoop()