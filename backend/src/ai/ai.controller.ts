import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service.js';

@ApiTags('Inteligencia Artificial y Recomendador')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommendations')
  @ApiOperation({ summary: 'Obtener recomendaciones personalizadas con IA según ocasión y estilo' })
  getRecommendations(
    @Body()
    body: {
      occasion?: string;
      style?: string;
      gender?: string;
      season?: string;
      budget?: number;
      colorPreference?: string;
    },
  ) {
    return this.aiService.getStylistRecommendations(body);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Conversar con el Asistente Virtual de Moda / Asesor de Imagen' })
  chat(@Body() body: { message: string }) {
    return this.aiService.chatWithFashionAdvisor(body.message);
  }

  @Get('reports/generative')
  @ApiOperation({ summary: 'Generar reporte inteligente con análisis en lenguaje natural' })
  getGenerativeReport() {
    return this.aiService.generateExecutiveReport();
  }
}
