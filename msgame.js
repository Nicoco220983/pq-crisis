const { abs, floor, ceil, min, max, sqrt, random: rand } = Math
const { log } = console

// utils

function _getArg(args, key, defVal) {
    let val = args && args[key]
    if (val === undefined) return defVal
    return val
}

const _isArr = Array.isArray

function _asArr(a) {
    if (a === undefined) return []
    return _isArr(a) ? a : [a]
}

function _createEl(name) {
    return document.createElement(name)
}

function _createCan(width, height) {
    const can = _createEl("canvas")
    can.width = width
    can.height = height
    return can
}

function _ctx(can) {
    return can.getContext("2d")
}

function _getCached(obj, key, getter) {
    let cache = obj._cache
    if (!cache) cache = obj._cache = {}
    let val = cache[key]
    if (val === undefined) val = cache[key] = getter()
    return val
}

function _wait(dt) {
    return new Promise((ok, ko) => setTimeout(ok, dt))
}

function _mayCall(a) {
    return (typeof a === "function") ? a() : a
}

export class Pool {
    constructor(nb, gen) {
        this.pool = []
        for (let i = 0; i < nb; ++i)
            this.pool.push(gen())
        this.curIte = 0
    }
    next() {
        const i = this.curIte
        const res = this.pool[i]
        this.curIte = (i + 1) % this.pool.length
        return res
    }
}

// canvas

export function createCanvas(width, height, kwargs) {
    const can = _createCan(width, height)
    if (kwargs && kwargs.fitWindow) {
        const canWoH = width / height
        const winW = window.innerWidth, winH = window.innerHeight
        const winWoH = winW / winH
        can.style.width = ((canWoH > winWoH) ? winW : floor(winH * canWoH)) + "px"
        can.style.height = ((canWoH > winWoH) ? floor(winW / canWoH) : winH) + "px"
    }
    return can
}

// elem

class Elem {

    constructor() {
        this.time = 0
    }

    update(dt) {
        this.time += dt
        this.trigger("update", dt)
    }

    on(evt, callback) {
        let evts = this._events
        if (!evts) evts = this._events = {}
        let callbacks = evts[evt]
        if (!callbacks) callbacks = evts[evt] = {}
        if (typeof callback === "function") {
            for (let i = 0; ; ++i) {
                const key = "_" + i
                if (callbacks[key] === undefined) {
                    callbacks[key] = callback
                    return
                }
            }
        } else {
            for (let key in callback)
                callbacks[key] = callback[key]
        }
    }

    off(evt, key) {
        if (evt === undefined) { delete this._events; return }
        let evts = this._events
        if (!evts) return
        if (key === undefined) { delete evts[evt]; return }
        let callbacks = evts[evt]
        if (!callbacks) return
        delete callbacks[key]
    }

    trigger(evt, ...args) {
        let evts = this._events
        if (!evts) return
        let callbacks = evts[evt]
        if (!callbacks) return
        for (let key in callbacks) {
            if (callbacks[key].call(this, ...args) === false)
                delete callbacks[key]
        }
    }

    remove() {
        this.removed = true
        this.trigger("remove")
    }

    every(key, period, fun) {
        const lastTime = this[key] || 0
        if (lastTime <= this.time) {
            fun()
            this[key] += _mayCall(period)
        }
    }
}

// Game

export class Game extends Elem {
    constructor(canvas, kwargs) {
        super()
        this.canvas = canvas
        this.width = canvas.width
        this.height = canvas.height
        this.fps = 60
        this.paused = false
        Object.assign(this, kwargs)
    }
    async initLoop() {
        await waitLoads()
        this.start()
        const timeFrame = 1 / this.fps
        let dt = timeFrame
        while (true) {
            const now = performance.now()
            if (!this.paused) this.update(dt)
            this.draw(_ctx(this.canvas), dt)
            const elapsed = (performance.now() - now) / 1000
            const toWait = max(0, timeFrame - elapsed)
            await _wait(toWait * 1000)
            dt = elapsed + toWait
        }
    }

    start() { }

    draw() { }

    pause(val) {
        if (val === this.paused) return
        this.paused = val
        pauseAudios(val)
    }

    // pointer

    addPointerDownListener(next) {
        this._addPointerListerner("mousedown", "touchstart", next)
    }

    addPointerUpListener(next) {
        this._addPointerListerner("mouseup", "touchend", next)
    }

    addPointerMoveListener(next) {
        this._addPointerListerner("mousemove", "touchmove", next)
    }

    _addPointerListerner(mousekey, touchkey, next) {
        this.canvas.addEventListener(mousekey, evt => {
            next(this._getEvtPos(evt))
        }, false)
        this.canvas.addEventListener(touchkey, evt => {
            evt.preventDefault()
            next(this._getEvtPos(evt.changedTouches[0]))
        }, false)
    }

    _getEvtPos(evt) {
        const canvas = this.canvas
        const rect = this.canvas.getBoundingClientRect()
        const strech = canvas.clientWidth / canvas.width
        return {
            x: (evt.clientX - rect.left) / strech,
            y: (evt.clientY - rect.top) / strech
        }
    }
}

// Scene

export class Scene extends Elem {
    constructor(game, kwargs) {
        super()
        this.game = game
        this.width = game.width
        this.height = game.height
        this.x = 0
        this.y = 0
        this.color = "white"
        Object.assign(this, kwargs)
        this.canvas = _createCan(this.width, this.height)
    }
    draw(ctx, dt) {
        const img = this.nextImg(dt)
        ctx.drawImage(img, ~~this.x, ~~this.y)
    }
    nextImg(dt) {
        const ctx = this.canvas.getContext("2d")
        ctx.fillStyle = this.color
        ctx.fillRect(0, 0, this.width, this.height)
        return this.canvas
    }
}

// Sprite

export function strechImg(img) {
    const { width, height } = this
    return { width, height }
}

export function fitImg(img) {
    const { width: sw, height: sh } = this
    const { width: iw, height: ih } = img
    const swh = sw / sh, iwh = iw / ih
    const cw = swh < iwh ? sw : iw * sh / ih
    const ch = swh > iwh ? sh : ih * sw / iw
    return { width: cw, height: ch }
}

export function fillImg(img) {
    const { width: sw, height: sh } = this
    const { width: iw, height: ih } = img
    const swh = sw / sh, iwh = iw / ih
    const cw = swh > iwh ? sw : iw * sh / ih
    const ch = swh < iwh ? sh : ih * sw / iw
    return { width: cw, height: ch }
}

export class Sprite extends Elem {
    constructor(scn, kwargs) {
        super()
        this.scene = scn
        this.x = 0
        this.y = 0
        this.width = 50
        this.height = 50
        this.anchorX = 0
        this.anchorY = 0
        this.anim = "black"
        this.animTime = 0
        Object.assign(this, kwargs)
    }

    getBoundaries() {
        const { x, y, width, height, anchorX, anchorY } = this
        return {
            x: x - width * anchorX,
            y: y - height * anchorY,
            width, height
        }
    }

    draw(ctx, viewX, viewY, dt) {
        const img = this.nextImg(dt)
        if (!img) return
        const { x, y } = this.getBoundaries()
        const imgX = (this.width - img.width) / 2
        const imgY = (this.height - img.height) / 2
        ctx.drawImage(img, ~~(x + imgX - viewX), ~~(y + imgY - viewY))
    }

    nextImg(dt) {
        this.animTime += dt
        let anim = this.anim
        if (!anim) return
        if (typeof anim == "string") anim = this.getDefaultAnim()
        const img = anim.getImg(this.animTime)
        if (!img) return
        if(this.autoTransformImg || img!==this.lastImg){
            this.lastImg = img
            const transArgs = this.scaleImg(img)
            if (this.animFlipX) transArgs.flipX = true
            if (this.animFlipY) transArgs.flipY = true
            this.lastTransImg = anim.transformImg(img, transArgs)
        }
        return this.lastTransImg
    }

    getDefaultAnim() {
        const color = this.anim
        return _getCached(this.constructor, `dImg:${color}`, () => {
            const size = 10
            const can = _createCan(size, size), ctx = _ctx(can)
            ctx.fillStyle = color
            ctx.fillRect(0, 0, size, size)
            return new Anim(can)
        })
    }
}

Sprite.prototype.autoTransformImg = true
Sprite.prototype.scaleImg = strechImg

// Loads

export const Loads = []

function _waitLoad(load) {
    return new Promise((ok, ko) => {
        const __waitLoad = () => {
            if (load.loaded) return ok()
            if (load.error) return ko(load.error)
            setTimeout(__waitLoad, 10)
        }
        __waitLoad()
    })
}

export function waitLoads() {
    return Promise.all(Loads.map(_waitLoad))
}

// SpriteSheet

export class SpriteSheet {
    constructor(src, kwargs) {
        this.src = src
        this.frames = []
        Object.assign(this, kwargs)
        this.load()
    }
    async load() {
        if (this.loaded) return
        Loads.push(this)
        const img = this.img = new Img(this.src)
        await _waitLoad(img)
        const frameWidth = this.frameWidth || img.width
        const frameHeight = this.frameHeight || img.height
        const ilen = floor(img.width / frameWidth)
        const jlen = floor(img.height / frameHeight)
        for (let j = 0; j < jlen; ++j) for (let i = 0; i < ilen; ++i) {
            const can = this.getFrame(i + ilen * j)
            can.width = frameWidth
            can.height = frameHeight
            _ctx(can).drawImage(img, ~~(-i * frameWidth), ~~(-j * frameHeight))
        }
        this.loaded = true
    }
    getFrame(num) {
        if (_isArr(num)) return num.map(i => this.getFrame(i))
        const frames = this.frames
        while (frames.length <= num) frames.push(_createCan(0, 0))
        return frames[num]
    }
}

// Anim

export class Anim {
    constructor(imgs, kwargs) {
        this.imgs = _asArr(imgs).map(img => (typeof img === "string") ? new Img(img) : img)
        this.fps = 1
        Object.assign(this, kwargs)
    }
    getImg(time) {
        const imgs = this.imgs
        const numImg = floor(time * this.fps) % imgs.length
        return imgs[numImg]
    }
    transformImg(img, kwargs) {
        return _getCached(img, JSON.stringify(kwargs), () => {
            const width = kwargs.width || img.width
            const height = kwargs.height || img.height
            const can = _createCan(width, height), ctx = _ctx(can)
            ctx.translate(kwargs.flipX ? width : 0, kwargs.flipY ? height : 0)
            ctx.scale(kwargs.flipX ? -1 : 1, kwargs.flipY ? -1 : 1)
            ctx.drawImage(img, 0, 0, width, height)
            return can
        })
    }
}

// Img

export class Img extends Image {
    constructor(src, kwargs) {
        super()
        this.src = src
        Object.assign(this, kwargs)
        Loads.push(this)
        this.onload = () => this.loaded = true
        this.onerror = () => this.error = `load error: ${src}`
    }
}

// Audio

export const Audios = []
export let VolumeLevel = 1

export class Aud extends Audio {
    constructor(src, kwargs) {
        super()
        this.src = src
        this.baseVolume = 1
        Object.assign(this, kwargs)
        this.syncVolume()
        Audios.push(this)
        Loads.push(this)
        this.onloadeddata = () => this.loaded = true
        this.onerror = () => this.error = `load error: ${src}`
    }
    playable() {
        return this.currentTime == 0 || this.ended
    }
    replay(kwargs) {
        if (!_getArg(kwargs, "force") && !this.playable())
            return
        this.currentTime = 0
        Object.assign(this, kwargs)
        this.syncVolume()
        this.play()
    }
    syncVolume() {
        this.volume = this.baseVolume * VolumeLevel
    }
}

export function pauseAudios(val) {
    Audios.forEach(a => {
        if (val) {
            if (a.currentTime == 0 || a.ended) return
            a.pause()
            a.pausedByGame = true
        } else {
            if (!a.pausedByGame) return
            a.play()
            a.pausedByGame = false
        }
    })
}

export function setVolumeLevel(val) {
    VolumeLevel = val
    Audios.forEach(a => a.syncVolume())
}

export class AudPool extends Pool {
    constructor(nb, src, kwargs) {
        super(nb, () => new Aud(src, kwargs))
    }
}

// math

export function sign(a) {
    if (a === 0) return 0
    return (a > 0) ? 1 : -1
}

export function bound(a, min, max) {
    if (a < min) return min
    if (a > max) return max
    return a
}

export function randge(from, to) {
    return from + rand() * (to - from)
}

export function range(a, b) {
    if (b === undefined) { b = a; a = 0 }
    const res = []
    for (let i = a; i < b; ++i) res.push(i)
    return res
}

// dynamics

export function accTo(spd, tgtSpd, acc, dec, dt) {
    if (spd == tgtSpd) return spd
    const a = (spd == 0 || spd * tgtSpd > 0) ? (acc * dt) : (dec * dt)
    if (tgtSpd > 0 || (tgtSpd == 0 && spd < 0)) {
        return min(spd + a, tgtSpd)
    } else if (tgtSpd < 0 || (tgtSpd == 0 && spd > 0)) {
        return max(spd - a, tgtSpd)
    }
}

export function moveTo(pos, tgt, spd, spdMax, acc, dec, dt) {
    const dist = tgt - pos, adist = abs(dist), sdist = sign(dist)
    const tgtSpd = bound(sdist * sqrt(adist * dec), -spdMax, spdMax)
    return accTo(spd, tgtSpd, acc, dec, dt)
}

// collision

export function collide(s1, s2) {
    if (s1.getBoundaries) s1 = s1.getBoundaries()
    if (s2.getBoundaries) s2 = s2.getBoundaries()
    let { x: x1, y: y1, width: w1, height: h1 } = s1
    let { x: x2, y: y2, width: w2, height: h2 } = s2
    w1 |= 0; h1 |= 0; w2 |= 0; h2 |= 0
    if (x1 > x2 + w2) return false
    if (x2 > x1 + w1) return false
    if (y1 > y2 + h2) return false
    if (y2 > y1 + h1) return false
    return true
}

// text

export class Text extends Sprite {
    /*
    draw(ctx, viewX, viewY, dt) {
        ctx.font = this.font || "20px Georgia"
        ctx.textAlign = this.textAlign || "center"
        ctx.textBaseline = this.textBaseline || "middle"
        ctx.fillStyle = this.color || "black"
        const value = _mayCall(this.value)
        const x = this.x - viewX
        const y = this.y - viewY
        if (this.lineHeight) {
            let i = 0
            value.split('\n').forEach(line => {
                ctx.fillText(line, ~~x, ~~y + i++ * this.lineHeight)
            })
        } else {
            ctx.fillText(value, ~~x, ~~y)
        }
    }*/
    getAlignText() {
        if (this.alignText) return this.alignText
        const { anchorX } = this
        if (anchorX === 0) return "left"
        if (anchorX === 1) return "right"
        return "center"
    }
    nextImg(dt) {
        const val = _mayCall(this.value)
        if (val !== this.prevValue) {
            this.prevValue = val
            const vals = val.split('\n')
            const can = this.lastImg = _createCan(1, 1), ctx = _ctx(can)
            const font = ctx.font = this.font || "20px Georgia"
            const lineHeight = this.lineHeight || parseInt(ctx.font)
            let width = 0, height = 0
            for (let val of vals) {
                width = max(width, ctx.measureText(val).width)
                height += lineHeight
            }
            this.width = can.width = ceil(width)
            this.height = can.height = ceil(height)
            ctx.font = font
            ctx.fillStyle = this.color || "black"
            ctx.textAlign = this.getAlignText()
            ctx.textBaseline = "top"
            let x = 0
            if (ctx.textAlign === "center") x = floor(width / 2)
            if (ctx.textAlign === "right") x = width
            for (let i in vals)
                ctx.fillText(vals[i], x, i * lineHeight)
        }
        return this.lastImg
    }
}

// flash

export class Flash extends Sprite {
    update(dt) {
        super.update(dt)
        if (this.time > this.ttl) this.remove()
    }
    draw(ctx, viewX, viewY, dt) {
        const rgb = this.rgb || "255,255,255"
        const age = 1 - this.time / this.ttl
        const { width, height } = this
        const size = min(width, height), center = size / 2
        const grd = ctx.createRadialGradient(
            center, center, .4 * size,
            center, center, (.3 * age + .7) * size);
        grd.addColorStop(0, `rgba(${rgb}, 0)`)
        grd.addColorStop(1, `rgba(${rgb}, ${1 - age})`)
        if (width > height) ctx.setTransform(width / height, 0, 0, 1, 0, 0)
        else ctx.setTransform(1, 0, 0, height / width, 0, 0)
        ctx.fillStyle = grd
        ctx.fillRect(~~viewX, ~~viewY, size, size)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
}

Flash.prototype.ttl = .15