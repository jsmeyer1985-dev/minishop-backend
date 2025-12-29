const axios = require('axios');

exports.handler = async (event) => {
  const formData = new URLSearchParams(event.body);
  const SHOP = 'your-store-name.myshopify.com'; // Replace with your actual store
  const TOKEN = process.env.SHOPIFY_API_TOKEN;

  const customer_id = formData.get('customer_id'); // Must be passed from form
  const minishop_name = formData.get('minishop_name');
  const minishop_banner = formData.get('banner_subtext');
  const reseller_name = formData.get('reseller_name');
  const whatsapp_number = formData.get('whatsapp_number');
  const whatsapp_group = formData.get('whatsapp_group');
  const about_us = formData.get('about_us');
  const button_color = formData.get('button_color');
  const shipping_fee = formData.get('shipping_fee');
  const bank_name = formData.get('bank_name');
  const account_holder = formData.get('account_holder');
  const account_number = formData.get('account_number');
  const branch_code = formData.get('branch_code');
  const markup = formData.get('markup');

  const metafields = [
    { key: 'minishop_name', value: minishop_name, type: 'single_line_text_field' },
    { key: 'minishop_banner', value: minishop_banner, type: 'single_line_text_field' },
    { key: 'minishop_reseller', value: reseller_name, type: 'single_line_text_field' },
    { key: 'minishop_whatsapp', value: whatsapp_number, type: 'single_line_text_field' },
    { key: 'minishop_group', value: whatsapp_group, type: 'url' },
    { key: 'minishop_about', value: about_us, type: 'multi_line_text_field' },
    { key: 'minishop_buttoncolor', value: button_color, type: 'color' },
    { key: 'minishop_shippingfee', value: shipping_fee, type: 'number_integer' },
    { key: 'minishop_bankname', value: bank_name, type: 'single_line_text_field' },
    { key: 'minishop_accountholder', value: account_holder, type: 'single_line_text_field' },
    { key: 'minishop_accountnumber', value: account_number, type: 'single_line_text_field' },
    { key: 'minishop_branchcode', value: branch_code, type: 'single_line_text_field' },
    { key: 'minishop_markup', value: markup, type: 'number_integer' }
  ];

  try {
    // Save metafields
    for (const field of metafields) {
      await axios.post(`https://${SHOP}/admin/api/2023-10/metafields.json`, {
        metafield: {
          namespace: 'minishop',
          key: field.key,
          value: field.value,
          type: field.type,
          owner_id: customer_id,
          owner_resource: 'customer'
        }
      }, {
        headers: {
          'X-Shopify-Access-Token': TOKEN,
          'Content-Type': 'application/json'
        }
      });
    }

    // Create MiniShop page
    const handle = `ms/${minishop_name.toLowerCase().replace(/\s+/g, '-')}/ms`;
    await axios.post(`https://${SHOP}/admin/api/2023-10/pages.json`, {
      page: {
        title: minishop_name,
        handle: handle,
        template_suffix: 'minishop-template',
        body_html: `<p>This MiniShop is powered by ${reseller_name}.</p>`
      }
    }, {
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      }
    });

    // Redirect to new page
    return {
      statusCode: 302,
      headers: {
        Location: `/pages/${handle}`
      },
      body: ''
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `MiniShop setup failed: ${err.message}`
    };
  }
};

