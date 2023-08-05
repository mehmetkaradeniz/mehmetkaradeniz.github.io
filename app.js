const MAX_HEALTH = 100;
const MIN_HEALTH = 0;

const PLAYER_ATTACK_MIN = 5;
const PLAYER_ATTACK_MAX = 10;
const MONSTER_ATTACK_MIN = 6;
const MONSTER_ATTACK_MAX = 12;
const BERSERK_TRIGGER_PERCENT = 20;
const BERSERK_MONSTER_ATTACK_MIN = 10;
const BERSERK_MONSTER_ATTACK_MAX = 24;
const PLAYER_HEAL_MIN = 12;
const PLAYER_HEAL_MAX = 24;

const SPECIAL_ATTACK_CD = 3;
const HEAL_CD = 2;

function getRandomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    return `${hours}:${minutes}:${seconds}`;
}

const app = Vue.createApp({
    data() {
        return {
            player: {
                name: "Player",
                health: 100,
                isDead: false,
                specialAttackCd: 0,
                healCd: 0
            },
            monster: {
                name: "Monster",
                health: 100,
                isDead: false,
                isBerserk: false
            },
            game: {
                isOver: false,
                isSurrender: false,
                isDraw: false,
                winner: ""
            },
            logs: []
        };
    },
    computed: {

        monsterHealthStyle() {
            return {
                width: this.monster.health + "%",
                backgroundColor: this.getHealthColorByValue(this.monster.health)
            };
        },

        playerHealthStyle() {
            return {
                width: this.player.health + "%",
                backgroundColor: this.getHealthColorByValue(this.player.health)
            };
        },

        isSpecialAttackOnCd() {
            return this.player.specialAttackCd > 0;
        },

        isHealOnCd() {
            return this.player.healCd > 0;
        },

    },

    watch: {
        'player.health': function (newValue, oldValue) {
            if (newValue <= 0)
                this.player.isDead = true;
        },
        'player.isDead': function (newValue, oldValue) {
            if (newValue) {
                this.game.isOver = true;
                if (this.monster.isDead)
                    this.game.isDraw = true;
                else
                    this.game.winner = this.monster.name;
            }
        },

        'monster.health': function (newValue, oldValue) {
            if (newValue <= 0)
                this.monster.isDead = true;

            if (!this.monster.isBerserk && newValue <= 60) {
                this.monster.isBerserk = true;
                this.addPlainLog("Monster goes Berserk!!");
            }
        },
        'monster.isBerserk': function (newValue, oldValue) {
            if (newValue)
                this.monster.name = "Berserker " + this.monster.name;
        },
        'monster.isDead': function (newValue, oldValue) {
            if (newValue) {
                this.game.isOver = true;
                if (this.player.isDead)
                    this.game.isDraw = true;
                else
                    this.game.winner = this.player.name;
            }
        },

        game: {
            deep: true,
            handler(newValue, oldValue) {
                if (newValue.isSurrender)
                    this.game.isOver = true;
            }
        },

    },
    methods: {

        // BUTTON ACTIONS
        attackMonster() {
            const dmg = getRandomIntBetween(PLAYER_ATTACK_MIN, PLAYER_ATTACK_MAX);
            this.doAttackMonster(dmg);
            this.turnPassed();
        },

        specialAttackMonster() {
            this.player.specialAttackCd += SPECIAL_ATTACK_CD;
            const dmg = getRandomIntBetween(PLAYER_ATTACK_MIN * 2, PLAYER_ATTACK_MAX * 3);
            this.doAttackMonster(dmg);
            this.turnPassed();
        },

        doAttackMonster(dmg) {
            this.reduceMonsterHealth(dmg);
            this.addPlayerAttackLog(dmg);
            this.attackPlayer();
        },

        attackPlayer() {
            let dmg = this.monster.isBerserk ? getRandomIntBetween(BERSERK_MONSTER_ATTACK_MIN, BERSERK_MONSTER_ATTACK_MAX)
                : getRandomIntBetween(MONSTER_ATTACK_MIN, MONSTER_ATTACK_MAX);
            this.reducePlayerHealth(dmg);
            this.addMonsterAttackLog(dmg);
        },

        healPlayer() {
            this.player.healCd += HEAL_CD;
            const heal = getRandomIntBetween(PLAYER_HEAL_MIN, PLAYER_HEAL_MAX);
            this.increasePlayerHealth(heal); // TODO player.healSelf
            this.addPlayerHealLog(heal);
            this.attackPlayer();
            this.turnPassed();
        },

        surrender() {
            this.game.isSurrender = true;
        },

        playAgain() {
            location.reload();
        },

        //

        increasePlayerHealth(amt) {
            this.player.health = Math.min(this.player.health + amt, MAX_HEALTH);
        },

        reducePlayerHealth(amt) {
            this.player.health = Math.max(this.player.health - amt, MIN_HEALTH);
        },

        reduceMonsterHealth(amt) {
            this.monster.health = Math.max(this.monster.health - amt, MIN_HEALTH);
        },

        turnPassed() {
            this.player.specialAttackCd = Math.max(this.player.specialAttackCd - 1, 0);
            this.player.healCd = Math.max(this.player.healCd - 1, 0);
        },

        // LOG
        addPlayerAttackLog(dmg) {
            const log = {
                type: 1, // attack log
                attacker: this.player.name,
                defender: this.monster.name,
                damage: dmg
            };
            this.addLog(log);
        },

        addMonsterAttackLog(dmg) {
            const log = {
                type: 1, // attack log
                attacker: this.monster.name,
                defender: this.player.name,
                damage: dmg
            };
            this.addLog(log);
        },

        addPlayerHealLog(heal) {
            const log = {
                type: 2, // heal log
                attacker: this.player.name,
                heal: heal
            }
            this.addLog(log);
        },

        addPlainLog(msg) {
            const log = {
                type: 0, // plain log
                message: msg
            };
            this.addLog(log);
        },

        addLog(log) {
            log.insertedAt = formatDate(new Date());
            this.logs.unshift(log);
        },

        // STYLE
        getHealthColorByValue(health) {
            if (health <= 30)
                return "red";

            if (health <= 80)
                return "orange";

            return "#00a876"; // green
        }

    }
});

app.mount('#game');