<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { publicRepository } from '../repositories/publicRepository.js'
import PodiumTop3 from '../components/PodiumTop3.vue'
import { classificarRanking } from '../domain/RankingPosicoes.js'
import { fotoDoAluno, usarAvatarPadraoNoErro } from '../utils/avatarPadrao.js'
import logo from '../assets/logo.png'
import bau from '../assets/bau.png'
import cenario from '../assets/cenario-castelo.webp'

const route = useRoute()
const slug = route.params.slug

const turma = ref(null)
const carregando = ref(true)
const materias = ref([])
const materiaId = ref('')
const ranking = ref([])
const conquistas = ref([])
const missao = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    turma.value = await publicRepository.getTurmaBySlug(slug)
    if (!turma.value) return
    materias.value = await publicRepository.getMateriasPublicas(slug)
    conquistas.value = await publicRepository.getConquistasPublicas(slug)
    missao.value = await publicRepository.getMissaoPublica(slug)
    if (materias.value.length > 0) materiaId.value = materias.value[0].id
  } catch (err) {
    error.value = err.message
  } finally {
    carregando.value = false
  }
})

watch(materiaId, async () => {
  if (!materiaId.value) return
  try {
    ranking.value = await publicRepository.getRankingPublico(slug, materiaId.value)
  } catch (err) {
    error.value = err.message
  }
})

const linhasPodio = computed(() =>
  ranking.value.map((linha) => ({
    aluno: { id: linha.aluno_id, nome: linha.nome, fotoUrl: linha.foto_url },
    notaFinal: Number(linha.nota_final)
  }))
)

const linhasTabela = computed(() => classificarRanking(linhasPodio.value))
const nomeMateria = computed(() => materias.value.find((m) => m.id === materiaId.value)?.nome ?? '')

// Conquistas agrupadas por aluno_id; os ícones seguem o campo "icone" do banco
const ICONES_CONQUISTA = ['clock', 'star', 'shield']
const conquistasPorAluno = computed(() => {
  const mapa = new Map()
  for (const c of conquistas.value) {
    if (!mapa.has(c.aluno_id)) mapa.set(c.aluno_id, new Map())
    mapa.get(c.aluno_id).set(c.conquista_icone, c.conquista_nome)
  }
  return mapa
})
const conquistasDoAluno = (alunoId) => {
  const doAluno = conquistasPorAluno.value.get(alunoId)
  if (!doAluno) return []
  return ICONES_CONQUISTA.filter((icone) => doAluno.has(icone)).map((icone) => ({ icone, nome: doAluno.get(icone) }))
}

const conquistaRecente = computed(() => conquistas.value[0] ?? null)
const fotoDaConquista = (c) => fotoDoAluno(ranking.value.find((l) => l.aluno_id === c.aluno_id)?.foto_url, c.aluno_nome)

const progressoMissao = computed(() => {
  if (!missao.value) return 0
  const meta = Number(missao.value.meta)
  if (!meta) return 0
  return Math.min(100, Math.max(0, (Number(missao.value.progresso_atual) / meta) * 100))
})

const CORES_MEDALHA = { 1: '#ffd23f', 2: '#c9d1dc', 3: '#d98b4a' }
</script>

<template>
  <div class="pagina">
    <p v-if="!carregando && !turma" class="vazio">Turma não encontrada.</p>
    <template v-else-if="turma">
      <header class="topo">
        <div class="topo-conteudo">
          <div class="marca">
            <img :src="logo" alt="" class="logo" />
            <div class="marca-texto">
              <span class="eduquest">EduQuest</span>
              <span class="slogan">APRENDER TAMBÉM É UM JOGO!</span>
            </div>
          </div>
          <div class="topo-direita">
            <span class="turma">TURMA <span class="ouro">{{ turma.nome }}</span></span>
            <label v-if="materias.length > 0" class="seletor seletor-topo">
              <span class="sr-only">Matéria</span>
              <select v-model="materiaId">
                <option v-for="materia in materias" :key="materia.id" :value="materia.id">{{ materia.nome }}</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <section class="hero" aria-label="Pódio da turma" :style="{ backgroundImage: `url(${cenario})` }">
        <div class="titulo">
          <div class="faixa">
            <div class="ponta ponta-esquerda" aria-hidden="true"></div>
            <div class="faixa-centro">
              <svg class="trofeu" viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label="Troféu">
                <rect x="3" y="1" width="10" height="1" fill="#a65f00" /><rect x="3" y="2" width="10" height="5" fill="#ffd23f" />
                <rect x="4" y="7" width="8" height="1" fill="#ffd23f" /><rect x="5" y="8" width="6" height="1" fill="#f0a500" />
                <rect x="7" y="9" width="2" height="3" fill="#f0a500" /><rect x="5" y="12" width="6" height="1" fill="#ffd23f" />
                <rect x="4" y="13" width="8" height="2" fill="#a65f00" /><rect x="0" y="2" width="3" height="1" fill="#ffd23f" />
                <rect x="0" y="3" width="1" height="3" fill="#ffd23f" /><rect x="1" y="5" width="2" height="1" fill="#ffd23f" />
                <rect x="13" y="2" width="3" height="1" fill="#ffd23f" /><rect x="15" y="3" width="1" height="3" fill="#ffd23f" />
                <rect x="13" y="5" width="2" height="1" fill="#ffd23f" /><rect x="5" y="3" width="1" height="3" fill="#fff6c4" />
              </svg>
              <h1>RANKING DA TURMA</h1>
            </div>
            <div class="ponta ponta-direita" aria-hidden="true"></div>
          </div>
          <p class="subtitulo">ALUNOS QUE FAZEM A DIFERENÇA!</p>
          <label v-if="materias.length > 0" class="seletor seletor-hero">
            <span class="sr-only">Matéria</span>
            <select v-model="materiaId">
              <option v-for="materia in materias" :key="materia.id" :value="materia.id">{{ materia.nome }}</option>
            </select>
          </label>
        </div>

        <div class="placa-madeira placa-esquerda">
          <div class="tabua">GRANDES CONQUISTAS COMEÇAM COM PEQUENAS ATITUDES!</div>
          <div class="poste" style="height: 90px"></div>
        </div>
        <div class="placa-madeira placa-direita">
          <div class="balao">VOCÊ TAMBÉM<br />PODE ESTAR AQUI!</div>
          <div class="placa-coluna">
            <div class="tabua">DISCIPLINA HOJE, GRANDES SONHOS AMANHÃ!</div>
            <div class="poste" style="height: 70px"></div>
          </div>
        </div>

        <PodiumTop3 v-if="linhasPodio.length > 0" :linhas="linhasPodio" />
        <p v-else class="aviso-hero">
          {{ materias.length === 0 ? 'Nenhuma matéria com tarefas ainda.' : 'Ainda não há notas lançadas nesta matéria.' }}
        </p>
      </section>

      <div class="grama" aria-hidden="true"></div>

      <div class="terra">
        <p v-if="error" class="erro">{{ error }}</p>
        <div class="grade">
          <section class="painel geral" aria-labelledby="titulo-geral">
            <div class="geral-topo">
              <div class="geral-titulo">
                <svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">
                  <rect x="0" y="4" width="2" height="4" fill="#eef2ff" /><rect x="3" y="0" width="2" height="8" fill="#eef2ff" />
                  <rect x="6" y="2" width="2" height="6" fill="#eef2ff" />
                </svg>
                <h2 id="titulo-geral">RANKING GERAL</h2>
              </div>
              <span v-if="linhasTabela.length > 0" class="contagem">{{ linhasTabela.length }} alunos · {{ nomeMateria }}</span>
            </div>
            <div v-if="linhasTabela.length > 0" class="rolagem">
              <table>
                <thead>
                  <tr>
                    <th scope="col" class="col-pos">#</th>
                    <th scope="col">ALUNO</th>
                    <th scope="col" class="col-pontos">PONTOS</th>
                    <th scope="col" class="col-conquistas">CONQUISTAS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="linha in linhasTabela"
                    :key="linha.aluno.id"
                    :class="{ topo3: linha.posicao <= 3 }"
                    :style="{ '--medalha': CORES_MEDALHA[linha.posicao] ?? '#2a3d6e' }"
                  >
                    <td class="col-pos posicao">{{ linha.posicao }}º</td>
                    <td class="col-aluno">
                      <div class="aluno">
                        <img :src="fotoDoAluno(linha.aluno.fotoUrl, linha.aluno.nome)" alt="" class="avatar" @error="usarAvatarPadraoNoErro($event, linha.aluno.nome)" />
                        <span>{{ linha.aluno.nome }}</span>
                      </div>
                    </td>
                    <td class="col-pontos pontos">{{ linha.notaFinal.toFixed(1) }}<span class="sufixo"> pts</span></td>
                    <td class="col-conquistas">
                      <div class="selos">
                        <span
                          v-for="c in conquistasDoAluno(linha.aluno.id)"
                          :key="c.icone"
                          class="selo"
                          :class="`selo-${c.icone}`"
                          :title="c.nome"
                        >
                          <svg viewBox="0 0 7 7" shape-rendering="crispEdges" role="img" :aria-label="c.nome">
                            <template v-if="c.icone === 'clock'">
                              <rect x="1" y="0" width="5" height="1" fill="#fff" /><rect x="0" y="1" width="1" height="5" fill="#fff" />
                              <rect x="6" y="1" width="1" height="5" fill="#fff" /><rect x="1" y="6" width="5" height="1" fill="#fff" />
                              <rect x="3" y="2" width="1" height="2" fill="#fff" /><rect x="4" y="3" width="1" height="1" fill="#fff" />
                            </template>
                            <template v-else-if="c.icone === 'star'">
                              <rect x="3" y="0" width="1" height="2" fill="#fff" /><rect x="0" y="2" width="7" height="1" fill="#fff" />
                              <rect x="1" y="3" width="5" height="1" fill="#fff" /><rect x="2" y="4" width="3" height="1" fill="#fff" />
                              <rect x="1" y="5" width="2" height="2" fill="#fff" /><rect x="4" y="5" width="2" height="2" fill="#fff" />
                            </template>
                            <template v-else>
                              <rect x="0" y="1" width="7" height="6" fill="#fff" /><rect x="1" y="0" width="1" height="2" fill="#fff" />
                              <rect x="5" y="0" width="1" height="2" fill="#fff" /><rect x="0" y="2" width="7" height="1" fill="#be123c" />
                              <rect x="2" y="4" width="1" height="1" fill="#be123c" /><rect x="3" y="5" width="1" height="1" fill="#be123c" />
                              <rect x="4" y="3" width="1" height="2" fill="#be123c" />
                            </template>
                          </svg>
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="sem-dados">Sem notas para mostrar ainda.</p>
          </section>

          <section v-if="missao" class="painel missao" aria-labelledby="titulo-missao">
            <svg class="pergaminho" viewBox="0 0 10 12" shape-rendering="crispEdges" aria-hidden="true">
              <rect x="1" y="0" width="8" height="2" fill="#c08a4a" /><rect x="2" y="2" width="6" height="8" fill="#f3d9a4" />
              <rect x="1" y="10" width="8" height="2" fill="#c08a4a" /><rect x="3" y="3" width="4" height="1" fill="#a0703a" />
              <rect x="3" y="5" width="4" height="1" fill="#a0703a" /><rect x="3" y="7" width="3" height="1" fill="#a0703a" />
              <rect x="0" y="0" width="1" height="2" fill="#8a5a2b" /><rect x="9" y="10" width="1" height="2" fill="#8a5a2b" />
            </svg>
            <div class="missao-texto">
              <h2 id="titulo-missao">MISSÃO DA SEMANA</h2>
              <p class="missao-titulo">{{ missao.titulo }}</p>
              <p v-if="missao.descricao" class="missao-descricao">{{ missao.descricao }}</p>
              <div class="progresso">
                <div class="barra" role="img" :aria-label="`Progresso: ${missao.progresso_atual} de ${missao.meta}`">
                  <div class="barra-cheia" :style="{ width: `${progressoMissao}%` }"></div>
                </div>
                <span class="fracao">{{ Number(missao.progresso_atual) }}/{{ Number(missao.meta) }}</span>
              </div>
            </div>
          </section>

          <section v-if="conquistaRecente" class="painel recente" aria-labelledby="titulo-recente">
            <svg class="estrela" viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true">
              <rect x="4" y="0" width="1" height="2" fill="#ffd23f" /><rect x="3" y="2" width="3" height="1" fill="#ffd23f" />
              <rect x="0" y="3" width="9" height="1" fill="#ffd23f" /><rect x="1" y="4" width="7" height="1" fill="#ffd23f" />
              <rect x="2" y="5" width="5" height="1" fill="#ffd23f" /><rect x="2" y="6" width="2" height="1" fill="#ffd23f" />
              <rect x="5" y="6" width="2" height="1" fill="#ffd23f" /><rect x="1" y="7" width="2" height="2" fill="#ffd23f" />
              <rect x="6" y="7" width="2" height="2" fill="#ffd23f" />
            </svg>
            <div class="recente-texto">
              <h2 id="titulo-recente">CONQUISTA RECENTE</h2>
              <div class="recente-aluno">
                <img :src="fotoDaConquista(conquistaRecente)" alt="" @error="usarAvatarPadraoNoErro($event, conquistaRecente.aluno_nome)" />
                <p>
                  <span class="ouro forte">{{ conquistaRecente.aluno_nome }}</span><br />
                  completou a conquista <span class="forte">“{{ conquistaRecente.conquista_nome }}”</span>!
                </p>
              </div>
            </div>
          </section>

          <section class="painel frase" aria-label="Frase da semana">
            <img :src="bau" alt="" />
            <p>“O CONHECIMENTO TE LEVA MAIS LONGE!”</p>
          </section>
        </div>
      </div>

      <footer class="rodape">
        <div class="rodape-conteudo">
          <span>EduQuest · Educação gamificada</span>
          <span>Aprender · Evoluir · Conquistar</span>
        </div>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  background: #16233f;
  color: #eef2ff;
  font-family: 'Nunito', system-ui, sans-serif;
  font-size: 17px;
  overflow-x: clip;
}
.vazio { padding: 40px 20px; font-size: 20px; text-align: center; }
.ouro { color: #ffd23f; }
.forte { font-weight: 800; }

/* Topo */
.topo { position: relative; z-index: 2; background: #13203d; border-bottom: 4px solid #0a1226; }
.topo-conteudo {
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 28px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.marca { display: flex; align-items: center; gap: 14px; }
.logo { width: 56px; height: 56px; object-fit: contain; image-rendering: pixelated; }
.marca-texto { display: flex; flex-direction: column; gap: 4px; }
.eduquest { font-family: 'Press Start 2P', monospace; font-size: 22px; color: #ffd23f; text-shadow: 3px 3px 0 #7a3b00; }
.slogan { font-family: 'VT323', monospace; font-size: 17px; letter-spacing: 1px; color: #c9d4f5; }
.topo-direita { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; min-width: 0; }
.turma { font-family: 'Press Start 2P', monospace; font-size: 11px; line-height: 1.5; color: #c9d4f5; overflow-wrap: anywhere; }
.seletor select {
  min-height: 44px;
  max-width: 100%;
  padding: 0 12px;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 15px;
  color: #eef2ff;
  background: #1d2c52;
  border: 3px solid #3b5190;
  border-radius: 4px;
}
.seletor-hero { display: none; }

/* Hero */
.hero {
  position: relative;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 20px 0;
  box-sizing: border-box;
  overflow: hidden;
  background-size: cover;
  background-position: center 30%;
  image-rendering: pixelated;
}
.titulo { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; max-width: 100%; }
.faixa { display: flex; align-items: center; max-width: 100%; }
.ponta { width: 38px; height: 56px; margin-top: 22px; background: #1d2c52; border: 4px solid #0a1226; flex: 0 0 auto; }
.ponta-esquerda { margin-right: -6px; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 35% 50%); }
.ponta-direita { margin-left: -6px; clip-path: polygon(0 0, 100% 0, 65% 50%, 100% 100%, 0 100%); }
.faixa-centro {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 34px;
  background: #13203d;
  border: 5px solid #0a1226;
  box-shadow: inset 0 0 0 4px #ffd23f, 0 6px 0 #0a1226;
}
.trofeu { width: 58px; height: 58px; flex: 0 0 auto; }
.faixa h1 {
  margin: 0;
  font-family: 'Press Start 2P', monospace;
  font-size: 34px;
  color: #ffd23f;
  text-shadow: 3px 3px 0 #7a3b00, 5px 5px 0 #0a1226;
  white-space: nowrap;
}
.subtitulo {
  margin: 12px 0 0;
  padding: 4px 14px;
  font-family: 'VT323', monospace;
  font-size: 24px;
  letter-spacing: 2px;
  color: #13203d;
  background: rgba(255, 255, 255, 0.75);
}
.aviso-hero {
  margin: auto 0 40px;
  padding: 12px 18px;
  font-weight: 800;
  color: #13203d;
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  border: 4px solid #0a1226;
}

/* Placas de madeira (somem em tela estreita) */
.placa-madeira { position: absolute; display: flex; flex-direction: column; }
.placa-esquerda { left: 4%; top: 170px; align-items: center; }
.placa-direita { right: 4%; top: 120px; align-items: flex-end; gap: 22px; }
.placa-coluna { display: flex; flex-direction: column; align-items: center; }
.tabua {
  width: 200px;
  padding: 22px 16px;
  box-sizing: border-box;
  background: #8a5a2b;
  border: 5px solid #4a2c10;
  box-shadow: inset 0 0 0 4px #b07a40, 6px 6px 0 rgba(0, 0, 0, 0.35);
  font-family: 'VT323', monospace;
  font-size: 23px;
  line-height: 1.15;
  letter-spacing: 1px;
  text-align: center;
  color: #fff1d0;
}
.placa-direita .tabua { padding: 20px 16px; }
.poste { width: 14px; background: #5b3814; border: 3px solid #3a2208; border-top: none; }
.balao {
  padding: 12px 18px;
  background: #fff;
  border: 4px solid #13203d;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  line-height: 1.7;
  color: #13203d;
  text-align: center;
  box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.3);
}

/* Grama e chão de terra */
.grama {
  height: 18px;
  background: #4caf2a;
  border-top: 4px solid #2d6b16;
  box-shadow: inset 0 -6px 0 #3a8f1f;
  background-image: repeating-linear-gradient(90deg, #6fd13a 0 8px, #4caf2a 8px 16px, #3a8f1f 16px 20px);
}
.terra {
  background-color: #6b4423;
  background-image:
    linear-gradient(45deg, rgba(0, 0, 0, 0.12) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.12) 75%),
    linear-gradient(45deg, rgba(0, 0, 0, 0.12) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.12) 75%);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
  padding: 30px 20px 44px;
}
.erro { max-width: 1280px; margin: 0 auto 16px; padding: 10px 14px; color: #fff; background: #be123c; border: 4px solid #0a1226; }

/* Ranking geral à esquerda; missão, conquista recente e frase na coluna lateral */
.grade {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: auto auto 1fr;
  gap: 18px 24px;
  align-items: start;
}
.geral { grid-column: 1; grid-row: 1 / span 3; }
.missao, .recente, .frase { grid-column: 2; }

.painel {
  background: #13203d;
  border: 4px solid #0a1226;
  box-shadow: inset 0 0 0 3px #2a3d6e, 6px 6px 0 rgba(0, 0, 0, 0.4);
}
.painel h2 { margin: 0; font-family: 'Press Start 2P', monospace; font-size: 12px; line-height: 1.4; }

.geral-topo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 3px solid #0a1226;
}
.geral-titulo { display: flex; align-items: center; gap: 14px; }
.geral-titulo svg { width: 26px; height: 26px; }
.geral h2 { font-size: 18px; color: #eef2ff; }
.contagem { font-family: 'VT323', monospace; font-size: 20px; color: #9fb0e0; }
.sem-dados { margin: 0; padding: 20px; color: #c9d4f5; }
.rolagem { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 17px; }
thead tr { font-family: 'VT323', monospace; font-size: 19px; letter-spacing: 2px; color: #9fb0e0; text-align: left; }
th { padding: 10px 12px; font-weight: 400; }
td { padding: 8px 12px; }
.col-pos { width: 56px; padding-left: 20px; padding-right: 20px; }
.col-pontos { width: 120px; white-space: nowrap; }
.col-conquistas { width: 170px; padding-right: 20px; }
tbody tr { background: #1a2b52; }
tbody tr:nth-child(even) { background: #162548; }
tbody tr.topo3 { box-shadow: inset 5px 0 0 var(--medalha); }
.posicao { font-family: 'Press Start 2P', monospace; font-size: 12px; color: #c9d4f5; }
.topo3 .posicao { color: var(--medalha); }
.aluno { display: flex; align-items: center; gap: 14px; font-weight: 600; }
.avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid var(--medalha);
  background: #0a1226;
}
.pontos { font-weight: 600; }
.selos { display: flex; gap: 8px; }
.selo {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #0a1226;
  border-radius: 50%;
}
.selo svg { width: 14px; height: 14px; }
.selo-clock { background: #0e7490; }
.selo-star { background: #f0a500; }
.selo-shield { background: #be123c; }

.missao { display: flex; gap: 16px; padding: 18px; }
.pergaminho { width: 52px; height: 60px; flex: 0 0 auto; }
.missao-texto { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.missao h2 { color: #4fc3f7; }
.missao p { margin: 0; }
.missao-titulo { font-weight: 800; }
.missao-descricao { color: #c9d4f5; font-size: 15px; }
.progresso { display: flex; align-items: center; gap: 12px; }
.barra { flex: 1 1 auto; height: 16px; padding: 2px; background: #0a1226; border: 3px solid #2a3d6e; border-radius: 10px; }
.barra-cheia { height: 100%; background: #22c55e; border-radius: 6px; box-shadow: inset 0 -4px 0 #15803d; }
.fracao { font-family: 'Press Start 2P', monospace; font-size: 11px; }

.recente {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 18px;
  background: #4c2a8a;
  border-color: #1e0f3d;
  box-shadow: inset 0 0 0 3px #7c4dd1, 6px 6px 0 rgba(0, 0, 0, 0.4);
}
.estrela { width: 44px; height: 44px; flex: 0 0 auto; }
.recente-texto { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.recente h2 { color: #d8c4ff; }
.recente-aluno { display: flex; align-items: center; gap: 12px; }
.recente-aluno img { width: 54px; height: 54px; flex: 0 0 auto; object-fit: cover; border: 3px solid #1e0f3d; border-radius: 6px; }
.recente-aluno p { margin: 0; line-height: 1.3; overflow-wrap: anywhere; }

.frase {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: #2f7a1f;
  border-color: #143d0b;
  box-shadow: inset 0 0 0 3px #4caf2a, 6px 6px 0 rgba(0, 0, 0, 0.4);
}
.frase img { width: 64px; height: 64px; flex: 0 0 auto; object-fit: contain; }
.frase p { margin: 0; font-family: 'Press Start 2P', monospace; font-size: 11px; line-height: 1.8; color: #f0ffe6; }

.rodape { background: #0f1a33; border-top: 4px solid #0a1226; }
.rodape-conteudo {
  max-width: 1280px;
  margin: 0 auto;
  padding: 18px 28px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  color: #9fb0e0;
  font-size: 14px;
}

@media (max-width: 1000px) {
  .placa-madeira { display: none; }
  .grade { grid-template-columns: minmax(0, 1fr); grid-template-rows: none; gap: 16px; }
  .geral, .missao, .recente, .frase { grid-column: 1; grid-row: auto; }
  .missao { order: 1; }
  .geral { order: 2; }
  .recente { order: 3; }
  .frase { order: 4; }
}

@media (max-width: 640px) {
  .pagina { font-size: 16px; }
  .topo-conteudo { padding: 10px 14px; gap: 10px; flex-wrap: nowrap; }
  .marca { gap: 10px; flex: 0 0 auto; }
  .logo { width: 40px; height: 40px; }
  .eduquest { font-size: 15px; text-shadow: 2px 2px 0 #7a3b00; }
  .slogan, .seletor-topo, .ponta, .subtitulo { display: none; }
  .turma { font-size: 10px; text-align: right; }
  .seletor-hero { display: flex; margin-top: 14px; }
  .seletor-hero select { border-color: #0a1226; }

  .hero { min-height: 560px; padding: 18px 10px 0; background-position: 62% 30%; }
  .faixa-centro { gap: 10px; padding: 10px 16px; border-width: 4px; box-shadow: inset 0 0 0 3px #ffd23f, 0 5px 0 #0a1226; }
  .trofeu { width: 30px; height: 30px; }
  .faixa h1 { font-size: 15px; text-shadow: 2px 2px 0 #7a3b00; }
  .grama { height: 14px; box-shadow: none; }
  .terra { padding: 20px 12px 30px; background-size: 20px 20px; background-position: 0 0, 10px 10px; }

  .painel { box-shadow: inset 0 0 0 3px #2a3d6e, 4px 4px 0 rgba(0, 0, 0, 0.4); }
  .painel h2 { font-size: 10px; }
  .geral-topo { padding: 12px 14px; }
  .geral-titulo { gap: 10px; }
  .geral-titulo svg { width: 18px; height: 18px; }
  .geral h2 { font-size: 13px; }
  .contagem { display: none; }
  table { font-size: 15px; }
  thead tr { font-size: 17px; letter-spacing: 1px; }
  th, td { padding: 7px 6px; }
  .col-pos { width: 36px; padding-left: 14px; padding-right: 10px; }
  .col-pontos { width: auto; text-align: right; padding-right: 14px; font-weight: 800; }
  .col-conquistas, .sufixo { display: none; }
  .posicao { font-size: 10px; }
  .aluno { gap: 10px; }
  .avatar { width: 32px; height: 32px; border-width: 2px; }

  .missao { gap: 12px; padding: 14px; }
  .pergaminho { width: 36px; height: 42px; }
  .missao-texto { gap: 6px; }
  .barra { height: 14px; }
  .fracao { font-size: 10px; }
  .recente, .frase { padding: 14px; gap: 12px; }
  .recente { box-shadow: inset 0 0 0 3px #7c4dd1, 4px 4px 0 rgba(0, 0, 0, 0.4); }
  .frase { box-shadow: inset 0 0 0 3px #4caf2a, 4px 4px 0 rgba(0, 0, 0, 0.4); }
  .estrela { display: none; }
  .recente-aluno img, .frase img { width: 50px; height: 50px; }
  .frase p { font-size: 9px; }
  .rodape-conteudo { padding: 16px 14px; }
}
</style>
