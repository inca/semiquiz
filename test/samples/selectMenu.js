{
  "signature": "c9048d78eeec949dfaa38731632ed3266a39bf044f1ad1859833128e7a59dc8c",
  "text": "Select menus are used inside text to provide single-choice alternatives.\n\n## Example\n\n1. There ({+is}{are}{can}) an airplane in the sky.\n\n2. There ({is}{are}{+can}) be only one.\n\n3. There ({is}{+are}{can}) many reasons.",
  "html": {
    "prompt": "<p>Select menus are used inside text to provide single-choice alternatives.</p>\n<h2>Example</h2><ol><li>There <select id=\"c-1e6c41c2\" name=\"c-1e6c41c2\"><option id=\"2c60392f\" value=\"2c60392f\">is</option><option id=\"0184b652\" value=\"0184b652\">are</option><option id=\"dbf124f0\" value=\"dbf124f0\">can</option></select> an airplane in the sky.\n\n</li><li>There <select id=\"c-a2ced4dc\" name=\"c-a2ced4dc\"><option id=\"8be6a1db\" value=\"8be6a1db\">is</option><option id=\"aaeff849\" value=\"aaeff849\">are</option><option id=\"0e6f1cea\" value=\"0e6f1cea\">can</option></select> be only one.\n\n</li><li>There <select id=\"c-78562237\" name=\"c-78562237\"><option id=\"b8608fe8\" value=\"b8608fe8\">is</option><option id=\"6441f554\" value=\"6441f554\">are</option><option id=\"2a64e1c8\" value=\"2a64e1c8\">can</option></select> many reasons.</li></ol>\n",
    "template": "<p>Select menus are used inside text to provide single-choice alternatives.</p>\n<h2>Example</h2><ol><li>There <select id=\"c-1e6c41c2\" name=\"c-1e6c41c2\"><option id=\"2c60392f\" value=\"2c60392f\">is</option><option id=\"0184b652\" value=\"0184b652\">are</option><option id=\"dbf124f0\" value=\"dbf124f0\">can</option></select> an airplane in the sky.\n\n</li><li>There <select id=\"c-a2ced4dc\" name=\"c-a2ced4dc\"><option id=\"8be6a1db\" value=\"8be6a1db\">is</option><option id=\"aaeff849\" value=\"aaeff849\">are</option><option id=\"0e6f1cea\" value=\"0e6f1cea\">can</option></select> be only one.\n\n</li><li>There <select id=\"c-78562237\" name=\"c-78562237\"><option id=\"b8608fe8\" value=\"b8608fe8\">is</option><option id=\"6441f554\" value=\"6441f554\">are</option><option id=\"2a64e1c8\" value=\"2a64e1c8\">can</option></select> many reasons.</li></ol>\n",
    "solution": "<p>Select menus are used inside text to provide single-choice alternatives.</p>\n<h2>Example</h2><ol><li>There <select id=\"c-1e6c41c2\" name=\"c-1e6c41c2\" disabled=\"disabled\"><option id=\"2c60392f\" value=\"2c60392f\" selected>is</option><option id=\"0184b652\" value=\"0184b652\">are</option><option id=\"dbf124f0\" value=\"dbf124f0\">can</option></select> an airplane in the sky.\n\n</li><li>There <select id=\"c-a2ced4dc\" name=\"c-a2ced4dc\" disabled=\"disabled\"><option id=\"8be6a1db\" value=\"8be6a1db\">is</option><option id=\"aaeff849\" value=\"aaeff849\">are</option><option id=\"0e6f1cea\" value=\"0e6f1cea\" selected>can</option></select> be only one.\n\n</li><li>There <select id=\"c-78562237\" name=\"c-78562237\" disabled=\"disabled\"><option id=\"b8608fe8\" value=\"b8608fe8\">is</option><option id=\"6441f554\" value=\"6441f554\" selected>are</option><option id=\"2a64e1c8\" value=\"2a64e1c8\">can</option></select> many reasons.</li></ol>\n"
  },
  "controls": [
    {
      "type": "selectMenu",
      "id": "c-1e6c41c2",
      "items": [
        {
          "id": "2c60392f",
          "value": true,
          "label": "is"
        },
        {
          "id": "0184b652",
          "value": false,
          "label": "are"
        },
        {
          "id": "dbf124f0",
          "value": false,
          "label": "can"
        }
      ]
    },
    {
      "type": "selectMenu",
      "id": "c-a2ced4dc",
      "items": [
        {
          "id": "8be6a1db",
          "value": false,
          "label": "is"
        },
        {
          "id": "aaeff849",
          "value": false,
          "label": "are"
        },
        {
          "id": "0e6f1cea",
          "value": true,
          "label": "can"
        }
      ]
    },
    {
      "type": "selectMenu",
      "id": "c-78562237",
      "items": [
        {
          "id": "b8608fe8",
          "value": false,
          "label": "is"
        },
        {
          "id": "6441f554",
          "value": true,
          "label": "are"
        },
        {
          "id": "2a64e1c8",
          "value": false,
          "label": "can"
        }
      ]
    }
  ]
}