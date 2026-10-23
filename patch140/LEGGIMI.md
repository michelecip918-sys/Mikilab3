# MikiLab v140 — Correzione della v139

**Per Emergent.** Estrai lo zip nella cartella principale del progetto (quella con `frontend` e `backend`), poi:

```bash
python patch140/applica_v140.py
sudo supervisorctl restart backend
cd frontend && yarn build
```

Non fare altro e non modificare altri file. Rispondi a Michele solo con: la riga che inizia con `V140 OK` (o `V140 FERMO`), le righe del log del backend che contengono `V140`, e l'esito della build.

Cosa fa (una volta sola, all'avvio, sul database pubblicato, cercando per nome): rimette i nomi giusti delle farine in 41 ricette e i procedimenti originali (senza malto) di Pane all'Nduja, Pane alla Curcuma e Zenzero, Pane allo Zafferano e Pinsa Romana. Allinea anche il file del seed. Foto, id, numeri delle ricette e mappa per Google non cambiano.
