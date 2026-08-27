from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

Image.new("RGB", (400, 300), (200, 150, 90)).save("/tmp/bread.jpg", "JPEG", quality=70)

c = canvas.Canvas("/tmp/two_recipes.pdf", pagesize=A4)
y = 780
c.setFont("Helvetica-Bold", 20)
c.drawString(60, y, "Pane Rustico")
c.setFont("Helvetica", 12)
for line in ["Ingredienti:", "500 g farina tipo 1", "350 g acqua", "10 g sale", "100 g lievito madre",
             "", "Procedimento:", "Impastare, riposo 3 ore, cuocere a 250C per 40 minuti."]:
    y -= 22
    c.drawString(60, y, line)
c.showPage()
y = 780
c.setFont("Helvetica-Bold", 20)
c.drawString(60, y, "Focaccia")
c.setFont("Helvetica", 12)
for line in ["Ingredienti:", "600 g farina 0", "480 g acqua", "12 g sale", "40 g olio di oliva",
             "", "Procedimento:", "Idratare bene, pieghe, teglia, cuocere a 230C per 25 minuti."]:
    y -= 22
    c.drawString(60, y, line)
c.showPage()
c.save()
print("ok")
