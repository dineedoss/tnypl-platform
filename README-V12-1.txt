TNYPL V12.1 OWNER PAGE REDESIGN

Included:
- Redesigned all six franchise owner pages for stronger mobile readability.
- Removed oversized faded owner-name watermark treatment.
- Darkened owner names, designations, biographies and vision text.
- Reduced excessive empty spacing.
- Standardized portrait treatment.
- Removed visible 'Owner Interview Coming Soon' placeholders.
- Embedded Porkai Pandian's supplied owner video on the Karaikudi Kings page.
- Added a responsive Owner Message section.
- Kept the video file local for immediate preview.
- The local MP4 can later be replaced by an official YouTube embed.

Deploy over the existing V12 project:
rm -rf /tmp/tnypl-v121
mkdir -p /tmp/tnypl-v121
unzip -o TNYPL_V12_1_Owner_Page_Redesign.zip -d /tmp/tnypl-v121
cp -r /tmp/tnypl-v121/* .
rm -f TNYPL_V12_1_Owner_Page_Redesign.zip
git add .
git commit -m "Redesign TNYPL owner pages and add Karaikudi owner video"
git push origin main
