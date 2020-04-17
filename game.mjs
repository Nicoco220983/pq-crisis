const { abs, floor, ceil, min, max, sqrt, pow, random: rand } = Math

import { init, load, Sprite, SpriteSheet, GameLoop, initPointer, onPointerDown, onPointerUp, pointer, audioAssets } from './ext/kontra-utils/kontra.min.mjs'

import {
    createFullScreenCanvas, sign, clamp, randge, accTo, moveTo, Lazy, Img, LazyImg, Anims, LazyAnims, Text, Flash, getPos,
    Aud, LazyAud, pauseAudios, unpauseAudios, replayAudio, setVolumeLevel, Pool, AudioPool, on, off, trigger, remove
} from './ext/kontra-utils/kontra-utils.mjs'


// game /////////////////////////

const WIDTH = 400, HEIGHT = 600
init(createFullScreenCanvas(WIDTH, HEIGHT))

const VOLUME_LEVEL = .3

const RUN_SPD = 400

const ANCHOR = { x: .5, y: 1 }

// game

const Game = GameLoop({
    update: function (dt) {
        if (!this.paused) {
            this.scene.update(dt)
        }
    },
    render: function () {
        if (!this.paused) {
            this.scene.render()
            Volume.render()
        }
    }
})

Game.restart = function () {
    remove(this.scene)
    this.scene = Scene()
}

Game.paused = false
Game.pause = () => {
    if (Game.paused) return
    Game.paused = true
    pauseAudios()
}
Game.unpause = () => {
    if (!Game.paused) return
    Game.paused = false
    unpauseAudios()
}

document.onfocus = () => Game.unpause()
document.onblur = () => Game.pause()

// scene

const Scene = function () {
    const scn = {
        time: 0,
        backSprites: [],
        sprites: [],
        update: function (dt) {
            if (this.state == "ONGOING") {
                trigger(Scene, "update", this)
                this.backSprites.forEach(s => s.update(dt))
                this.sprites.forEach(s => s.update(dt))
                this.backSprites = this.backSprites.filter(s => s.isAlive())
                this.sprites = this.sprites.filter(s => s.isAlive())
                this.time += dt
                if (this.time > DURATION + 3) {
                    this.finish()
                }
            }
        },
        render: function () {
            this.backSprites.forEach(s => s.render())
            this.sprites.sort((a, b) => a.y > b.y)
            this.sprites.forEach(s => s.render())
        },
        finish: function () {
            this.state = "END"
            let x = WIDTH / 2
            let font = "30px Arial"
            let textAlign = "center"
            this.sprites.push(Text({
                x, y: 200,
                font, textAlign,
                value: `SCORE: ${this.score}`
            }))
            font = "20px Arial"
            let text = "Niveau: Victime du système\nAucune chance de survie\nEssaie au moins d'atteindre 1000 points"
            if (this.score >= 1000) {
                text = "Niveau: Simple citoyen\nTu peux tenir 1 petite semaine\nProchain niveau: 2000"
            }
            if (this.score >= 2000) {
                text = "Niveau: Consommateur\nTu sais remplir un caddie\nProchain niveau: 4000"
            }
            if (this.score >= 4000) {
                text = "Niveau: Consom'Acteur\nTu est actif dans la consommation\nProchain niveau: 8000"
            }
            if (this.score >= 8000) {
                text = "Niveau: Guerrier\nC'est pas à toi qu'on va la faire\nProchain niveau: 12000"
            }
            if (this.score >= 12000) {
                text = "Niveau: Survivaliste\nTu peux affronter la crise sereinement\nProchain niveau: 16000"
            }
            if (this.score >= 16000) {
                text = "Niveau: Mâle/Femme alpha\nCrise ou pas, tu vas tous les écraser\nProchain niveau: 20000"
            }
            if (this.score >= 20000) {
                text = "Niveau: Instinct animal\nTu as depuis bien longtemps\narrêter de penser aux autres\nProchain niveau: 25000"
            }
            if (this.score >= 25000) {
                text = "Niveau: IronMan\nNul ne peut t'arrêter\nProchain niveau: 30000"
            }
            if (this.score >= 30000) {
                text = "Niveau: SuperMan\nTu as probablement du sang de cryptonien\nProchain niveau: 40000"
            }
            if (this.score >= 40000) {
                text = "Niveau: PQ Man\nTu ne fais qu'un avec le PQ\nProchain niveau: 50000"
            }
            if (this.score >= 50000) {
                text = "Niveau MAX ! Dieu du PQ\nTu t'épanouis pleinement dans la crise"
            }
            this.sprites.push(Text({
                x, y: 300,
                font, textAlign,
                value: text,
                lineHeight: 40
            }))
            this.sprites.push(Text({
                x, y: 550,
                font, textAlign,
                value: `Touchez pour recommencer`
            }))
            on(this, "click", () => Game.restart())
        }
    }
    trigger(Scene, "start", scn)
    return scn
}

on(Scene, "start", scn => {
    scn.state = "START"
    const introSprites = []
    const ctx = {
        x: WIDTH / 2,
        font: "30px Arial",
        textAlign: "center"
    }
    introSprites.push(Text({
        ...ctx, y: 70,
        value: "PQ Crisis"
    }))
    ctx.font = "20px Arial"
    introSprites.push(Text({
        ...ctx, y: 130,
        value: "C'est la crise ! Achetez vite\ndes biens de première nécessité\navant la pénurie:",
        lineHeight: 30
    }))
    ctx.textAlign = "right"
    introSprites.push(Text({
        ...ctx, x: ctx.x - 35, y: 250,
        value: "PQ:"
    }))
    introSprites.push(Sprite({
        x: ctx.x, y: 250,
        image: Img("./assets/PQ.png"),
        width: 50, height: 50,
        anchor: { x: .5, y: .5 }
    }))
    introSprites.push(Text({
        ...ctx, x: ctx.x - 35, y: 300,
        value: "Pates:"
    }))
    introSprites.push(Sprite({
        x: ctx.x, y: 300,
        image: Img("./assets/pates.png"),
        width: 50, height: 50,
        anchor: { x: .5, y: .5 }
    }))
    introSprites.push(Text({
        ...ctx, x: ctx.x - 35, y: 350,
        value: "Chocolat:"
    }))
    introSprites.push(Sprite({
        x: ctx.x, y: 350,
        image: Img("./assets/choco.png"),
        width: 50, height: 50,
        anchor: { x: .5, y: .5 }
    }))
    ctx.textAlign = "left"
    introSprites.push(Text({
        ...ctx, x: ctx.x + 35, y: 250,
        value: "+1 point"
    }))
    introSprites.push(Text({
        ...ctx, x: ctx.x + 35, y: 300,
        value: "+5 point"
    }))
    introSprites.push(Text({
        ...ctx, x: ctx.x + 35, y: 350,
        value: "+15 point"
    }))
    ctx.textAlign = "center"
    introSprites.push(Text({
        ...ctx, y: 550,
        value: "Touchez pour commencer"
    }))
    introSprites.forEach(s => scn.sprites.push(s))
    on(scn, "click", () => {
        if (scn.state != "START") return
        scn.state = "ONGOING"
        trigger(Scene, "ongoing", scn)
        introSprites.forEach(s => {
            s.dy = RUN_SPD
            s.update = function (dt) {
                checkNotBelowScreen(this)
                this.advance(dt)
            }
        })
        const aud = Aud('./assets/music.mp3')
        replayAudio(aud, { baseVolume: .2 })
        on(scn, "remove", () => aud.pause())
    })
})

// pointer

initPointer()
onPointerDown(() => {
    pointer.isDown = true
    trigger(Game, "click")
    trigger(Game.scene, "click")
})
onPointerUp(() => pointer.isDown = false)

// volume

const VolumeAnims = LazyAnims({
    image: Img('./assets/volume.png'),
    frameWidth: 50,
    frameHeight: 50,
    animations: {
        "on": { frames: 0 },
        "off": { frames: 1 }
    }
})

const Volume = Sprite({
    x: WIDTH - 20,
    y: 20,
    width: 50,
    height: 50,
    anchor: { x: 1, y: 0 },
    animations: VolumeAnims.get()
})

let volumeMuted = false
on(Game, "click", () => {
    if (Volume.collidesWith({ x: pointer.x, y: pointer.y, width: 1, height: 1 })) {
        volumeMuted = !volumeMuted
        setVolumeLevel(volumeMuted ? 0 : VOLUME_LEVEL)
        Volume.playAnimation(volumeMuted ? 'off' : 'on')
    }
})

// level

const START_LEVEL = 1

function getNextLevelPoints(scn) {
    return 10 + (scn.level - 1) * 5
}

on(Scene, "ongoing", scn => {
    scn.level = START_LEVEL
    scn.levelPoints = 0
    const text = Text({
        x: 10,
        y: 35,
        textBaseline: "top",
        textAlign: "left"
    })
    text.getValue = function () {
        return `Level: ${scn.level} (${scn.levelPoints}/${getNextLevelPoints(scn)})`
    }
    scn.sprites.push(text)
})

on(Scene, "update", scn => {
    if (scn.levelPoints >= getNextLevelPoints(scn))
        levelUp(scn)
})

function levelUp(scn) {
    scn.level += 1
    scn.levelPoints = 0
    scn.sprites.push(Text({
        x: WIDTH / 2,
        y: HEIGHT / 2,
        dy: -50,
        ttl: 30,
        value: "LEVEL UP",
        color: "green",
        font: "50px Arial",
        textBaseline: "top",
        textAlign: "center"
    }))
    scn.sprites.push(Flash({
        width: WIDTH,
        height: HEIGHT,
        rgb: "0,255,0"
    }))
    replayAudio(audioAssets['./assets/levelup.mp3'])
}

// time

const DURATION = 60

on(Scene, "ongoing", scn => {
    scn.time = 0
    const text = Text({
        x: 10,
        y: 60,
        textBaseline: "top",
        textAlign: "left"
    })
    text.getValue = function () {
        return `Time: ${max(0, floor(DURATION - scn.time))}`
    }
    scn.sprites.push(text)
})

// background

const DALLE_SIZE = 50

const DalleAnims = LazyAnims({
    image: Img('./assets/dalles.jpg'),
    frameWidth: 50,
    frameHeight: 50,
    animations: {
        0: { frames: 0 },
        1: { frames: 1 },
        2: { frames: 2 },
        3: { frames: 3 }
    }
})

let LastDalle

on(Scene, "start", scn => {
    // init start dalles
    const nbDallesY = HEIGHT / DALLE_SIZE
    for (let j = nbDallesY; j >= 0; --j) {
        createDalleRow(scn, {
            y: j * DALLE_SIZE
        })
    }
})

on(Scene, "update", scn => {
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
    const s = Sprite({
        dy: RUN_SPD,
        animations: DalleAnims.get(),
        width: DALLE_SIZE,
        height: DALLE_SIZE
    })
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
    s.playAnimation(anim)
    s.update = function (dt) {
        checkNotBelowScreen(this)
        this.advance(dt)
    }
    scn.backSprites.push(s)
    return s
}

// Hero

const SPDMAX = 2000, ACC = 2000, DEC = 2000

const HeroAnims = LazyAnims({
    image: Img('./assets/caddie.png'),
    frameWidth: 124,
    frameHeight: 200,
    animations: {
        stand: {
            frames: 0
        },
        run: {
            frames: '1..4',
            frameRate: 10
        },
        slide: {
            frames: 5
        }
    }
})

on(Scene, "start", scn => {
    scn.hero = Sprite({
        x: WIDTH / 2,
        y: 500,
        animations: HeroAnims.get(),
        width: 50,
        height: 80,
        anchor: ANCHOR,
        prevDx: 0
    })
    scn.hero.playAnimation('run')
    scn.hero.position.clamp(25, 25, WIDTH - 25, HEIGHT - 25)
    scn.hero.update = function (dt) {
        if (pointer.isDown) {
            this.dx = moveTo(this.x, pointer.x, this.dx, SPDMAX, ACC, DEC, dt)
            if (abs(this.dx) < abs(this.prevDx) && abs(this.dx) > 250) {
                scn.hero.playAnimation('slide')
                this.width = (this.dx > 0) ? 50 : -50
                const aud = audioAssets['./assets/screech.mp3']
                if (aud.currentTime == 0 || aud.ended) replayAudio(aud, { baseVolume: .2 })
            } else {
                scn.hero.playAnimation('run')
                this.width = 50
            }
        } else {
            this.dx = accTo(this.dx, 0, ACC, DEC, dt)
            scn.hero.playAnimation('run')
        }
        this.prevDx = this.dx
        this.advance(dt)
    }
    scn.hero.damage = function (n) {
        scn.score -= n
        scn.levelPoints = 0
        scn.sprites.push(Text({
            x: this.x,
            y: this.y - 100,
            dy: -50,
            ttl: 30,
            value: "-" + n,
            color: "red"
        }))
        scn.sprites.push(Flash({
            width: WIDTH,
            height: HEIGHT,
            rgb: "255,0,0"
        }))
        replayAudio(audioAssets['./assets/ouch.mp3'])
    }
    scn.sprites.push(scn.hero)
})

// Score

on(Scene, "ongoing", scn => {
    scn.score = 0
    const s = Text({
        x: 10,
        y: 10,
        textBaseline: "top",
        textAlign: "left"
    })
    s.getValue = function () {
        return `Score: ${scn.score}`
    }
    scn.sprites.push(s)
})

// items

const ITEM_SIZE = 30

const ItemAudioPool = Lazy(() => AudioPool(5, audioAssets['./assets/item.mp3']))

on(Scene, "update", scn => {
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
        if (i == nb - 1) {
            type = (rand() > .5) ? "choco" : "pates"
        }
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
    const image = new Image()
    let score, name
    switch (type) {
        case "pq":
            score = 1
            name = "PQ"
            image.src = './assets/PQ.png'
            break
        case "pates":
            score = 5
            name = "Pates"
            image.src = './assets/pates.png'
            break
        case "choco":
            score = 15
            name = "Chocolat"
            image.src = './assets/choco.png'
            break
    }
    const s = Sprite({
        x,
        y,
        image,
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        anchor: ANCHOR,
        dy: RUN_SPD,
        type,
        name,
        score
    })
    s.update = function (dt) {
        if (this.collidesWith(scn.hero)) {
            this.collide()
        }
        checkNotBelowScreen(this)
        this.advance(dt)
    }
    s.collide = function () {
        remove(this)
        const addScore = this.score * pow(2, scn.level - 1)
        scn.score += addScore
        scn.levelPoints += 1
        scn.sprites.push(Text({
            x: this.x,
            y: this.y - 30,
            dy: -50,
            ttl: 30,
            value: `${this.name}: +${addScore}`,
            color: "green"
        }))
        replayAudio(ItemAudioPool.get().next(), { baseVolume: .2 })
    }
    scn.sprites.push(s)
}


// enemy: etagere

const ETAGERE_NBX = 6

const EtagereImg = LazyImg('./assets/etagere.png')

on(Scene, "update", scn => {
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
    const self = Sprite({
        x: kwargs.x,
        y: 0,
        width: WIDTH / ETAGERE_NBX,
        height: WIDTH / ETAGERE_NBX * 2,
        anchor: ANCHOR,
        dy: RUN_SPD,
        image: EtagereImg.get(),
        score: 5
    })
    self.update = function (dt) {
        if (!this.collided && this.collidesWith(scn.hero)) {
            this.onCollide()
        }
        checkNotBelowScreen(this)
        this.advance(dt)
    }
    self._collidesWith = self.collidesWith
    self.collidesWith = function (obj) {
        const pos = getPos(obj)
        pos.x += 5
        pos.width -= 10
        pos.y += 5
        pos.height -= 120
        return this._collidesWith(pos)
    }
    self.onCollide = function () {
        this.collided = true
        scn.hero.damage(this.score)
    }
    scn.sprites.push(self)
}




// enemy: rival

on(Scene, "update", scn => {
    if (scn.time > DURATION || scn.level < 3) return
    const nextTime = scn.nextRivalTime || 0
    if (scn.time > nextTime) {
        createRival(scn)
        scn.nextRivalTime = scn.time + 3 + 2 * rand()
    }
})
function createRival(scn) {
    const rival = Sprite({
        x: 25 + rand() * (WIDTH - 25),
        y: 0,
        animations: HeroAnims.get(),
        width: 50,
        height: 80,
        anchor: ANCHOR,
        dx: rand() * 100 - 50,
        dy: RUN_SPD / 2,
        score: 5
    })
    rival.playAnimation('run')
    rival.update = function (dt) {
        if ((this.x < (this.width / 2) && this.dx < 0) || (this.x > (WIDTH - this.width / 2) && this.dx > 0)) {
            this.dx = - this.dx
        }
        if (!this.collided && this.collidesWith(scn.hero)) {
            this.onCollide()
        }
        checkNotBelowScreen(this)
        this.advance(dt)
    }
    rival._collidesWith = rival.collidesWith
    rival.collidesWith = function (obj) {
        const pos = getPos(obj)
        pos.x += 10
        pos.width -= 20
        pos.y += 5
        pos.height -= 60
        return this._collidesWith(pos)
    }
    rival.onCollide = function () {
        this.collided = true
        scn.hero.damage(this.score)
    }
    scn.sprites.push(rival)
}




// enemy: flame

const FLAME_SIZE = 40

const FlameAnims = LazyAnims({
    image: Img('./assets/flame.png'),
    width: 10,
    frameWidth: 40,
    frameHeight: 80,
    animations: {
        burn: {
            frames: '0..3',
            frameRate: 10
        }
    }
})

on(Scene, "update", scn => {
    if (scn.time > DURATION || scn.level < 5) return
    const nextTime = scn.nextFlameTime || 0
    if (scn.time > nextTime) {
        createFlame(scn)
        scn.nextFlameTime = scn.time + 2 / (scn.level - 3) * randge(.7, 1.3)
    }
})
function createFlame(scn) {
    const flame = Sprite({
        x: FLAME_SIZE / 2 + rand() * (WIDTH - FLAME_SIZE / 2),
        y: 0,
        animations: FlameAnims.get(),
        width: FLAME_SIZE,
        height: FLAME_SIZE * 2,
        anchor: ANCHOR,
        dy: RUN_SPD,
        score: 10
    })
    flame.update = function (dt) {
        if (!this.collided && this.collidesWith(scn.hero)) {
            this.onCollide()
        }
        checkNotBelowScreen(this)
        this.advance(dt)
    }
    flame._collidesWith = flame.collidesWith
    flame.collidesWith = function (obj) {
        const pos = getPos(obj)
        pos.x += 5
        pos.width -= 10
        pos.y += 5
        pos.height -= 70
        return this._collidesWith(pos)
    }
    flame.onCollide = function () {
        this.collided = true
        scn.hero.damage(this.score)
    }
    scn.sprites.push(flame)
}

// utils

function checkNotBelowScreen(sprite) {
    if (sprite.y > HEIGHT + sprite.height) remove(sprite)
}

// start

load(
    './assets/PQ.png',
    './assets/pates.png',
    './assets/choco.png',
    './assets/flame.png',
    './assets/dalles.jpg',
    './assets/caddie.png',
    './assets/etagere.png',
    './assets/volume.png',
    './assets/item.mp3',
    './assets/levelup.mp3',
    './assets/ouch.mp3',
    './assets/screech.mp3'
).then(() => {
    setVolumeLevel(VOLUME_LEVEL)
    Game.scene = Scene()
    Game.start()
})