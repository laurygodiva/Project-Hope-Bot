import { EmbedBuilder } from 'discord.js';

export function buildEmbed(embed) {
  const builder = new EmbedBuilder();
  if (embed.title) builder.setTitle(embed.title);
  if (embed.description) builder.setDescription(embed.description);
  if (embed.color) builder.setColor(embed.color);
  if (embed.imageURL) builder.setImage(embed.imageURL);
  if (embed.thumbnailURL) builder.setThumbnail(embed.thumbnailURL);
  if (embed.footer) builder.setFooter({ text: embed.footer, iconURL: embed.footerIconURL || undefined });
  return builder;
}
