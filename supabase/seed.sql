-- Gerado por scripts/gerar-seed.ts a partir de src/data/seed.ts. Não edite à mão.
-- Para banco recém-criado (as migrações já aplicadas).
begin;

insert into public.igreja (id, nome, slug) values ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Ministério de Louvor', 'louvor');

insert into public.funcao (id, igreja_id, nome, ordem, max_por_culto, modo_padrao) values
  ('5a992a38-2b98-5ade-a093-1e61905f0ca4', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Bateria', 1, 1, 'cifra'),
  ('8180f857-3d54-5024-8eb7-b2c76b68c429', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Baixo', 2, 1, 'cifra'),
  ('7aa49fa5-44ea-5c60-99ba-6ed85d600aea', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Piano', 3, 1, 'cifra'),
  ('08e69332-0434-5a70-94e2-f4d9fe200d72', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Guitarra', 4, 1, 'cifra'),
  ('394f76c0-ba5c-5928-9322-2fefa8a9e762', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Teclado', 5, 1, 'cifra'),
  ('72bc81f8-7141-5b86-8f91-b97cb419312a', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Ministração', 6, 1, 'letra'),
  ('9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Vocal', 7, 3, 'letra');

insert into public.integrante (id, igreja_id, nome) values
  ('3371157f-2153-5e4e-9a40-e02641611ffc', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Breno'),
  ('d6d04945-f013-5d3b-a80b-9b8e174bb782', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Matheus'),
  ('27fc209d-36b0-505d-b35a-38f532ec2dcb', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Daniel'),
  ('5ed7869d-2ea7-5c63-ad38-b72e8785dd3a', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Yan'),
  ('72e1ad24-d02b-5a04-9fb0-aac407e8be0a', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Lucas'),
  ('420bc3db-7ae8-5836-a68c-4229dd65f8c8', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Sofia'),
  ('5527f91a-abfb-513f-a3b6-7ca3400620ae', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Grazi'),
  ('895b3364-e9b1-5bf3-bb03-2b78e4081de6', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Mayara'),
  ('c484a758-3d8f-5ce7-9aa8-5f194fe0efb8', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Taty'),
  ('5dcd6674-a8ad-5050-a434-654f07ef70a0', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Melissa');

insert into public.integrante_funcao (igreja_id, integrante_id, funcao_id, periodo) values
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '3371157f-2153-5e4e-9a40-e02641611ffc', '5a992a38-2b98-5ade-a093-1e61905f0ca4', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '3371157f-2153-5e4e-9a40-e02641611ffc', '5a992a38-2b98-5ade-a093-1e61905f0ca4', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '5a992a38-2b98-5ade-a093-1e61905f0ca4', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '5a992a38-2b98-5ade-a093-1e61905f0ca4', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '8180f857-3d54-5024-8eb7-b2c76b68c429', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '8180f857-3d54-5024-8eb7-b2c76b68c429', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '08e69332-0434-5a70-94e2-f4d9fe200d72', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '08e69332-0434-5a70-94e2-f4d9fe200d72', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '72bc81f8-7141-5b86-8f91-b97cb419312a', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', '72bc81f8-7141-5b86-8f91-b97cb419312a', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '27fc209d-36b0-505d-b35a-38f532ec2dcb', '7aa49fa5-44ea-5c60-99ba-6ed85d600aea', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '27fc209d-36b0-505d-b35a-38f532ec2dcb', '7aa49fa5-44ea-5c60-99ba-6ed85d600aea', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '27fc209d-36b0-505d-b35a-38f532ec2dcb', '394f76c0-ba5c-5928-9322-2fefa8a9e762', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '27fc209d-36b0-505d-b35a-38f532ec2dcb', '394f76c0-ba5c-5928-9322-2fefa8a9e762', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5ed7869d-2ea7-5c63-ad38-b72e8785dd3a', '394f76c0-ba5c-5928-9322-2fefa8a9e762', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5ed7869d-2ea7-5c63-ad38-b72e8785dd3a', '394f76c0-ba5c-5928-9322-2fefa8a9e762', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5ed7869d-2ea7-5c63-ad38-b72e8785dd3a', '7aa49fa5-44ea-5c60-99ba-6ed85d600aea', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5ed7869d-2ea7-5c63-ad38-b72e8785dd3a', '08e69332-0434-5a70-94e2-f4d9fe200d72', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '72e1ad24-d02b-5a04-9fb0-aac407e8be0a', '72bc81f8-7141-5b86-8f91-b97cb419312a', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '72e1ad24-d02b-5a04-9fb0-aac407e8be0a', '72bc81f8-7141-5b86-8f91-b97cb419312a', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '72e1ad24-d02b-5a04-9fb0-aac407e8be0a', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '72e1ad24-d02b-5a04-9fb0-aac407e8be0a', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '72e1ad24-d02b-5a04-9fb0-aac407e8be0a', '8180f857-3d54-5024-8eb7-b2c76b68c429', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '420bc3db-7ae8-5836-a68c-4229dd65f8c8', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '420bc3db-7ae8-5836-a68c-4229dd65f8c8', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '420bc3db-7ae8-5836-a68c-4229dd65f8c8', '72bc81f8-7141-5b86-8f91-b97cb419312a', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5527f91a-abfb-513f-a3b6-7ca3400620ae', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5527f91a-abfb-513f-a3b6-7ca3400620ae', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '895b3364-e9b1-5bf3-bb03-2b78e4081de6', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '895b3364-e9b1-5bf3-bb03-2b78e4081de6', '394f76c0-ba5c-5928-9322-2fefa8a9e762', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'c484a758-3d8f-5ce7-9aa8-5f194fe0efb8', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'c484a758-3d8f-5ce7-9aa8-5f194fe0efb8', '72bc81f8-7141-5b86-8f91-b97cb419312a', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5dcd6674-a8ad-5050-a434-654f07ef70a0', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'manha'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5dcd6674-a8ad-5050-a434-654f07ef70a0', '9b1cacf3-4a5b-534a-8c0e-f05fc308c36e', 'noite'),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', '5dcd6674-a8ad-5050-a434-654f07ef70a0', '7aa49fa5-44ea-5c60-99ba-6ed85d600aea', 'manha');

insert into public.musica (id, igreja_id, titulo, tom_original, hinario_numero, hinario_sigla, tags, cifra, letra) values
  ('2971bf35-258b-5583-94e5-eb4392a46a09', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Felicidade no Serviço', 'E', 410, 'CC', array['celebração']::text[], '{title: Felicidade no Serviço}
{key: E}

{start_of_intro: Intro}
[E] [D/E] [E] [D/E]
[E] [D/E] [E] [D/E] [A/E]
{end_of_intro}

{start_of_verse: Estrofe 1}
No serv[E]iço do meu Rei eu sou feliz
Satisfe[F#m]ito, [B]abençoad[E]o   [B7]
Proclam[E]ando do meu Rei a salva[C#m]ção
No serv[F#m]iço d[B]o meu Re[E]i
{end_of_verse}

{start_of_chorus: Refrão}
No serv[E]iço do meu R[A/E]ei
Minha v[B]ida emp[B/A]regare[E/G#]i
Gozo, p[E7/D]az, felicida[A]de
[A#°]Tem quem ser[B]ve a meu bom R[E]ei  [B7]
{end_of_chorus}

{start_of_verse: Estrofe 2}
No serv[E]iço do meu Rei eu sou feliz
Obedien[F#m]te e [B]corajoso[E]    [B7]
Na trist[E]eza ou na alegria sei sor[C#m]rir
No serv[F#m]iço d[B]o meu Re[E]i
{end_of_verse}

{start_of_chorus: Refrão}
No serv[E]iço do meu R[A/E]ei
Minha v[B]ida emp[B/A]regare[E/G#]i
Gozo, p[E7/D]az, felicida[A]de
[A#°]Tem quem ser[B]ve a meu bo[E]m Re[B7]i
{end_of_chorus}

{start_of_verse: Estrofe 3}
No serv[E]iço do meu Rei eu sou feliz
Jubilos[F#m]o e c[B]onsagrad[E]o   [B7]
Ao seu l[E]ado desafio a todo [C#m]mal
No serv[F#m]iço d[B]o meu Re[E]i
{end_of_verse}

{start_of_chorus: Refrão}
No serv[E]iço do meu R[A/E]ei
Minha v[B]ida emp[B/A]regare[E/G#]i
Gozo, p[E7/D]az, felicida[A]de
[A#°]Tem quem ser[B]ve a meu bo[E]m Re[B7]i
{end_of_chorus}

{start_of_verse: Estrofe 4}
No serv[E]iço do meu Rei eu sou feliz
Venturo[F#m]so e [B]decidido[E]    [B7]
Quanto t[E]enho no serviço gas[C#m]tarei
No serv[F#m]iço d[B]o meu Re[E]i
{end_of_verse}

{start_of_chorus: Refrão}
No serv[E]iço do meu R[A/E]ei
Minha v[B]ida emp[B/A]regare[E/G#]i
Gozo, p[E7/D]az, felicida[A]de
[A#°]Tem quem ser[B]ve a meu bom R[E]ei
{end_of_chorus}
', '[Estrofe 1]
No serviço do meu Rei eu sou feliz
Satisfeito, abençoado
Proclamando do meu Rei a salvação
No serviço do meu Rei

[Refrão]
No serviço do meu Rei
Minha vida empregarei
Gozo, paz, felicidade
Tem quem serve a meu bom Rei

[Estrofe 2]
No serviço do meu Rei eu sou feliz
Obediente e corajoso
Na tristeza ou na alegria sei sorrir
No serviço do meu Rei

[Refrão]
No serviço do meu Rei
Minha vida empregarei
Gozo, paz, felicidade
Tem quem serve a meu bom Rei

[Estrofe 3]
No serviço do meu Rei eu sou feliz
Jubiloso e consagrado
Ao seu lado desafio a todo mal
No serviço do meu Rei

[Refrão]
No serviço do meu Rei
Minha vida empregarei
Gozo, paz, felicidade
Tem quem serve a meu bom Rei

[Estrofe 4]
No serviço do meu Rei eu sou feliz
Venturoso e decidido
Quanto tenho no serviço gastarei
No serviço do meu Rei

[Refrão]
No serviço do meu Rei
Minha vida empregarei
Gozo, paz, felicidade
Tem quem serve a meu bom Rei'),
  ('93051cfd-00f8-5ec2-b451-8ebb91fc2af9', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Exaltai', 'E', null, null, '{}'::text[], null, null),
  ('d99e0b73-a709-52fc-9c9d-77e6fb04ada0', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Ao Que É Digno', 'E', null, null, '{}'::text[], null, null),
  ('c13cada1-20de-5fbb-a316-aa0a52acc3c5', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Quem Sou Eu', 'E', null, null, '{}'::text[], null, null),
  ('3c193ab9-2960-5bca-b767-95aa04b1cd8a', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Porque Ele Vive', 'E', null, null, '{}'::text[], null, null),
  ('6e1643af-aa1d-52c5-bb2f-487438bdff96', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'Grande É o Senhor', 'G', null, null, '{}'::text[], null, null);

insert into public.culto (id, igreja_id, data, periodo, escala_publicada, repertorio_publicado) values ('d6a4a42b-455c-5104-841f-dbf3c3ddc331', '3d1f72fe-c426-5bb9-afaf-80e0b0802386', '2026-11-15', 'noite', true, true);
insert into public.escala_item (igreja_id, culto_id, funcao_id, integrante_id, posicao) values
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '5a992a38-2b98-5ade-a093-1e61905f0ca4', '3371157f-2153-5e4e-9a40-e02641611ffc', 1),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '8180f857-3d54-5024-8eb7-b2c76b68c429', 'd6d04945-f013-5d3b-a80b-9b8e174bb782', 1),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '7aa49fa5-44ea-5c60-99ba-6ed85d600aea', '27fc209d-36b0-505d-b35a-38f532ec2dcb', 1),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '394f76c0-ba5c-5928-9322-2fefa8a9e762', '5ed7869d-2ea7-5c63-ad38-b72e8785dd3a', 1),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '72bc81f8-7141-5b86-8f91-b97cb419312a', '72e1ad24-d02b-5a04-9fb0-aac407e8be0a', 1);
insert into public.setlist_item (igreja_id, culto_id, musica_id, ordem, tom, observacao) values
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '2971bf35-258b-5583-94e5-eb4392a46a09', 1, 'E', null),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '93051cfd-00f8-5ec2-b451-8ebb91fc2af9', 2, 'E', null),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', 'd99e0b73-a709-52fc-9c9d-77e6fb04ada0', 3, 'E', null),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', 'c13cada1-20de-5fbb-a316-aa0a52acc3c5', 4, 'E', null),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '3c193ab9-2960-5bca-b767-95aa04b1cd8a', 5, 'E', null),
  ('3d1f72fe-c426-5bb9-afaf-80e0b0802386', 'd6a4a42b-455c-5104-841f-dbf3c3ddc331', '6e1643af-aa1d-52c5-bb2f-487438bdff96', 6, 'G', null);

commit;
