"""Sostituisce le ~45 foto stock Unsplash con foto MikiLab dedicate (DB + seed)."""
import asyncio, os, json, urllib.request
from dotenv import load_dotenv
load_dotenv()
from motor.motor_asyncio import AsyncIOMotorClient

PUB = "/app/frontend/public/recipes"
SEED = "/app/backend/mikilab_seed_data.json"
B = "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/"
URL = {
 "foc_lievito_madre":"0f4b04fdcd10a2e3bb6ea51301cefa606b8558d75974f8efb298f2e08795e8f0",
 "p_baguette_lm":"0594b7feff94b5ce042721c01717fe792518564443d73cccf66b1cde2fcf4b82",
 "p_pancassetta":"5dee2a1e1c80462c9e1a38b916eb6f5ac213da6f0583b2d3ae547d41c03691ab",
 "p_kristall":"f44fbcc98d94a0c427b88405dd8ab6ffb69aa30342e3843c6a7128ab19acdedd",
 "p_casereccio_lm":"0171441065e22a9dc19d3908e8b1a3ebad6fe40974df10e970d9a3bf2d09c535",
 "p_integrale_lm":"7edde5b8aa2fd13011388ae362b878ca553170262e07a26f60fb50a87e9719cf",
 "p_cereali_morbido":"252c84aa6f30160278274aaba954036fbca60827d1d6ded90372a776a1105c78",
 "p_carbone":"6021c0ef8617940e771d6534c605947b9d2dbc0c650eeb78f8f57ced64cfc83a",
 "p_spinaci":"9a5ffa2c098f4526a9301067cfe4ef6bc83db495b1d994a12ed24fffa12fff9b",
 "p_nduja":"6901c7854f51ab6e87d2460a39e162933aecd4e2202f92a4af9db44e3374cce8",
 "p_barbabietola":"15ec75f76a56c192667f060d70e916e7bce5c01edd1037ecc0fbdda496a04239",
 "p_curcuma_zenzero":"44e19bd447890e681edcf2430389d67fb50a1c575ecd5155ec63a8fe14f2b79b",
 "p_spirulina":"4fab183a44e5cf2807fc4e36140fb7388dfac948606507cc119850f1d3025e7d",
 "p_zafferano":"8e919fa6b61c3d421e730b9cea5d458962a2a52d96163ec35f2315f630fc4bb3",
 "p_cristallo":"526f850926a075fac28a63baf78a96575ac09b00f7ede979d5582b83c4780653",
 "pan_canapa":"7c21df54a31b003828b7784fa40cfeeff4965684d78a6ad331016461a0b7ba66",
 "pn_burger":"ec542e59fc6a7daf491033b05ec78ccb47df98f4e806207475434cf0ada24177",
 "pn_basilico_pomodoro":"af90fd4313ed69cb1fc4e58f776a28ea9d8d1426b10a526e8588bdd24d305cd1",
 "pn_latte_soffici":"a1b43ce2a32a82c51f85d37e826378ebdab6cc91b7497ed7fca62a019d4615bd",
 "pn_quark":"1857b6068ae19d06fd383733c0798949d97882340b3df8f937ae1c05b282119b",
 "sn_crackers":"80a87b5c95fd3b203417d5015d20184810f9380301d4837546f4d55ee0d704ea",
 "sn_croissant_salato":"73e1f15528e2b8d61773d4842f51b682d27749a11e685599af99de0dfc0fc143",
 "sn_quarkballchen":"eb7c3a266451c3fbd65db96cd4c494f3f61fbe9ebd2d88db26f2c954c69eb962",
 "sn_grissini":"28735e78556d0bcb5b386a3bfe145fb8673767eaea200295ca757fec01df82e6",
 "sn_grissini_sesamo":"2d30d414f5e59b272d25fcaec44bbcb17a50457b80ddbb6dabfdf78eefebde2b",
 "sn_bretzel_farcito":"a3c1f080ec4df3c124fbf7235b4ef2fb554fbb7d329137e0db3139350d462984",
 "sn_panino_ita":"97034c162d164de5ab55ddffa76cb8130d7426a08fc06e22bb8e42b7ac08f86b",
 "sn_panzerotti":"1e865dde0df5f5074798c04aaf3c89592d1963304aa9a132e6578c601a3541a4",
 "sn_pizzette":"e977113adb14a49ae53a9d085895fd24b404b99a0845d9204da99bb8ca86209b",
 "sn_rustici":"9570518907702a105b1ced07f1ca147b1806edcb55150ad88d08f00d05e9edb2",
 "v_brioche":"c52e2743f469861ae944e7693fa000f9d62a57db94cf7b45d3817eb78f78c259",
 "v_cornetti_ita":"e717355dc624b2d7250c3b8a27b6601d567a6e808f12877674a025a96d6781f6",
 "v_bicolore_cacao":"c40835744c6823fb0e224cf00267ef62cbcc8433eaea07c01a3bdea78d7bcb7d",
 "v_bicolore_carbone":"5890ad713bc481fdb5b60544926bee6f2d9717fe1dbf3116b23fc463d73cf0b2",
 "v_bicolore_rosa":"2dd3fd7959b5f4a86cce46e1b982f51ce5fddb32aa8c72750999cf7b0ee72152",
 "v_doppio_pist_cioc":"8017c89ec523409d39255ed4379816619a7a2d4b7afce21d3512258a883a71ac",
 "v_croissant_classici":"c4dc702950dfa6b6549ba3d95485739e02390bc10aa1802c8161944e5d82b4ec",
 "v_croissant_trad":"65a4212d35e828a0cc181fd2b1d97578696c757e2039fa11fd4e36cc7be07789",
 "v_danese_crema":"da912e394d1a5ce62104e0c9842094a61e4d5e9f074661b4179a333e218426e8",
 "v_danish_plunder":"93a5169c95dbc916666bec7ed117c3bc4e18ff02e5314ab7bc0a13b6286fe933",
 "v_girella_uvetta":"10e22d1a27bfe1dfd90d49ea3da3fdf51a6147a0dcaed6ee9a1a0be7c8dbf900",
 "v_painauchocolat":"1955910d7782229f81fa5d84b8bd4257d4ce6aaeaa8c5e27110c2d910064ebd0",
 "v_saccottino_crema":"4f033a9bd2fdd7cd651b1e437ddad8cc75ff903c36d78f99a8c0e4738ba1e33f",
 "v_stollen":"7aba68444d268f673c9f833efae702930c4f86d184c29dc78b110ba6aabe4a5b",
 "v_veneziana":"a1a604757fe2ca9b60c964310850457f96b7f64ae1d3f85b293e123c5ca8329a",
}
NAME2SLUG = {
 "Focaccia a Lievito Madre":"foc_lievito_madre","Baguette a Lievito Madre":"p_baguette_lm",
 "Pan Latte in Cassetta (Kochstück)":"p_pancassetta","Pan di Kristall (alta idratazione 95%)":"p_kristall",
 "Pane Casereccio a Lievito Madre":"p_casereccio_lm","Pane Integrale a Lievito Madre":"p_integrale_lm",
 "Pane Morbido ai Cereali (Kochstück)":"p_cereali_morbido","Pane Nero al Carbone Vegetale":"p_carbone",
 "Pane agli Spinaci":"p_spinaci","Pane all'Nduja":"p_nduja","Pane alla Barbabietola":"p_barbabietola",
 "Pane alla Curcuma e Zenzero":"p_curcuma_zenzero","Pane alla Spirulina":"p_spirulina","Pane allo Zafferano":"p_zafferano",
 "Pane di Cristallo ad Alta Idratazione col Metodo Mickey Lab":"p_cristallo",
 "Panettone Artigianale MikiLab — Verde Canapa":"pan_canapa","Pane da Hamburger (bun soffice)":"pn_burger",
 "Panini Basilico e Pomodoro":"pn_basilico_pomodoro","Panini al Latte Soffici (Kochstück)":"pn_latte_soffici",
 "Panini al Quark (Quarkbrötchen)":"pn_quark","Crackers Croccanti ai Semi":"sn_crackers",
 "Croissant Farcito Salato":"sn_croissant_salato","Frittelle al Quark (Quarkbällchen)":"sn_quarkballchen",
 "Grissini Stirati Torinesi":"sn_grissini","Grissini al Sesamo":"sn_grissini_sesamo",
 "Panino Bavarese al Bretzel Farcito":"sn_bretzel_farcito","Panino Farcito all'Italiana":"sn_panino_ita",
 "Panzerotti Fritti Pugliesi":"sn_panzerotti","Pizzette Rosse da Rosticceria":"sn_pizzette",
 "Rustici Sfogliati al Formaggio":"sn_rustici","Brioche Francese (col burro)":"v_brioche",
 "Cornetti all'Italiana: La Brioche Sfogliata Aromatica":"v_cornetti_ita",
 "Cornetto Bicolore Cacao e Vaniglia":"v_bicolore_cacao","Cornetto Bicolore Carbone e Vaniglia":"v_bicolore_carbone",
 "Cornetto Bicolore Rosa (Rapa Rossa) e Vaniglia":"v_bicolore_rosa","Cornetto Doppio Gusto Pistacchio e Cioccolato":"v_doppio_pist_cioc",
 "Croissant Sfogliati Classici Senza Zucchero nell'Impasto":"v_croissant_classici",
 "Croissant Sfogliati Tradizionali con Zucchero":"v_croissant_trad","Danese alla Crema (Plunder)":"v_danese_crema",
 "Danish Pastry e Plunder: La Sfoglia Lievitata Austriaca":"v_danish_plunder","Girella all'Uvetta (Pain aux Raisins)":"v_girella_uvetta",
 "Pain au Chocolat (Saccottino al Cioccolato)":"v_painauchocolat","Saccottino alla Crema":"v_saccottino_crema",
 "Stollen Tedesco Tradizionale delle Feste":"v_stollen","Veneziana (grande lievitato dolce)":"v_veneziana",
}

async def main():
    for slug, h in URL.items():
        urllib.request.urlretrieve(B + h + ".jpeg", f"{PUB}/{slug}.jpg")
    c = AsyncIOMotorClient(os.environ["MONGO_URL"]); db = c[os.environ["DB_NAME"]]
    upd = 0
    for name, slug in NAME2SLUG.items():
        r = await db.recipes.update_one({"collection_name": "mikilab", "name": name}, {"$set": {"image_url": f"/recipes/{slug}.jpg"}})
        upd += r.modified_count
        if r.matched_count == 0: print("NOT FOUND:", name)
    seed = json.load(open(SEED)); n = 0
    for rec in seed:
        if rec.get("name") in NAME2SLUG:
            rec["image_url"] = f"/recipes/{NAME2SLUG[rec['name']]}.jpg"; n += 1
    json.dump(seed, open(SEED, "w"), ensure_ascii=False, indent=2)
    print("downloaded:", len(URL), "| DB updated:", upd, "| seed updated:", n)

if __name__ == "__main__":
    asyncio.run(main())
