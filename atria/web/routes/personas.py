"""Persona management API endpoints."""

from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from atria.core.personas import PersonaManager, Persona
from atria.web.state import get_state

router = APIRouter(prefix="/api/personas", tags=["personas"])


class PersonaRequest(BaseModel):
    """Request model for creating/updating a persona."""

    name: str
    description: str
    agent_tone: str | None = None
    agent_style: str | None = None
    agent_behavior: str | None = None
    section_overrides: dict[str, str] = {}
    subagent_overrides: dict[str, str] = {}


class PersonaResponse(BaseModel):
    """Response model for a persona."""

    name: str
    description: str
    is_built_in: bool
    created_at: str
    agent_tone: str | None
    agent_style: str | None
    agent_behavior: str | None
    section_overrides: dict[str, str]
    subagent_overrides: dict[str, str]


@router.get("")
async def list_personas() -> List[PersonaResponse]:
    """List all available personas.

    Returns:
        List of personas
    """
    try:
        manager = PersonaManager()
        personas = manager.list_personas()
        return [
            PersonaResponse(
                name=p.name,
                description=p.description,
                is_built_in=p.is_built_in,
                created_at=p.created_at,
                agent_tone=p.agent_tone,
                agent_style=p.agent_style,
                agent_behavior=p.agent_behavior,
                section_overrides=p.section_overrides,
                subagent_overrides=p.subagent_overrides,
            )
            for p in personas
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}")
async def get_persona(name: str) -> PersonaResponse:
    """Get a persona by name.

    Args:
        name: Persona name

    Returns:
        Persona details

    Raises:
        HTTPException: If persona not found
    """
    try:
        manager = PersonaManager()
        persona = manager.get_persona(name)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")
        return PersonaResponse(
            name=persona.name,
            description=persona.description,
            is_built_in=persona.is_built_in,
            created_at=persona.created_at,
            agent_tone=persona.agent_tone,
            agent_style=persona.agent_style,
            agent_behavior=persona.agent_behavior,
            section_overrides=persona.section_overrides,
            subagent_overrides=persona.subagent_overrides,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_persona(request: PersonaRequest) -> PersonaResponse:
    """Create a new persona.

    Args:
        request: Persona creation request

    Returns:
        Created persona

    Raises:
        HTTPException: If creation fails
    """
    try:
        manager = PersonaManager()

        # Check if persona already exists
        if manager.get_persona(request.name):
            raise HTTPException(
                status_code=400, detail=f"Persona '{request.name}' already exists"
            )

        persona = Persona(
            name=request.name,
            description=request.description,
            is_built_in=False,
            agent_tone=request.agent_tone,
            agent_style=request.agent_style,
            agent_behavior=request.agent_behavior,
            section_overrides=request.section_overrides,
            subagent_overrides=request.subagent_overrides,
        )

        manager.save_persona(persona)

        return PersonaResponse(
            name=persona.name,
            description=persona.description,
            is_built_in=persona.is_built_in,
            created_at=persona.created_at,
            agent_tone=persona.agent_tone,
            agent_style=persona.agent_style,
            agent_behavior=persona.agent_behavior,
            section_overrides=persona.section_overrides,
            subagent_overrides=persona.subagent_overrides,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{name}")
async def update_persona(name: str, request: PersonaRequest) -> PersonaResponse:
    """Update an existing persona.

    Args:
        name: Persona name to update
        request: Updated persona data

    Returns:
        Updated persona

    Raises:
        HTTPException: If persona not found or update fails
    """
    try:
        manager = PersonaManager()
        existing = manager.get_persona(name)
        if not existing:
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")

        persona = Persona(
            name=request.name,
            description=request.description,
            is_built_in=False,
            agent_tone=request.agent_tone,
            agent_style=request.agent_style,
            agent_behavior=request.agent_behavior,
            section_overrides=request.section_overrides,
            subagent_overrides=request.subagent_overrides,
        )

        manager.save_persona(persona)

        # Delete old file if name changed
        if name != request.name:
            manager.delete_persona(name)

        return PersonaResponse(
            name=persona.name,
            description=persona.description,
            is_built_in=persona.is_built_in,
            created_at=persona.created_at,
            agent_tone=persona.agent_tone,
            agent_style=persona.agent_style,
            agent_behavior=persona.agent_behavior,
            section_overrides=persona.section_overrides,
            subagent_overrides=persona.subagent_overrides,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{name}")
async def delete_persona(name: str) -> dict[str, str]:
    """Delete a persona.

    Args:
        name: Persona name to delete

    Returns:
        Confirmation message

    Raises:
        HTTPException: If persona not found or deletion fails
    """
    try:
        manager = PersonaManager()
        if not manager.delete_persona(name):
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")
        return {"message": f"Persona '{name}' deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{name}/duplicate")
async def duplicate_persona(name: str, new_name: str) -> PersonaResponse:
    """Duplicate an existing persona.

    Args:
        name: Source persona name
        new_name: Name for the new persona

    Returns:
        New persona

    Raises:
        HTTPException: If source not found or duplication fails
    """
    try:
        manager = PersonaManager()
        persona = manager.duplicate_persona(name, new_name)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")
        return PersonaResponse(
            name=persona.name,
            description=persona.description,
            is_built_in=persona.is_built_in,
            created_at=persona.created_at,
            agent_tone=persona.agent_tone,
            agent_style=persona.agent_style,
            agent_behavior=persona.agent_behavior,
            section_overrides=persona.section_overrides,
            subagent_overrides=persona.subagent_overrides,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}/preview")
async def preview_persona(name: str) -> dict[str, str]:
    """Preview the final composed prompt for a persona.

    Args:
        name: Persona name

    Returns:
        Preview containing the composed main agent prompt

    Raises:
        HTTPException: If persona not found or preview fails
    """
    try:
        from atria.core.agents.prompts.composition import create_default_composer
        from pathlib import Path

        manager = PersonaManager()
        persona = manager.get_persona(name)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")

        # Compose prompt with persona overrides
        templates_dir = Path(__file__).parent.parent.parent / "core" / "agents" / "prompts" / "templates"
        composer = create_default_composer(templates_dir)

        context = {"in_git_repo": False, "todo_tracking_enabled": False, "has_subagents": False}
        prompt = composer.compose(context)

        # Apply agent customizations if present
        if persona.agent_tone:
            prompt += f"\n\n[PERSONA - TONE]: {persona.agent_tone}"
        if persona.agent_style:
            prompt += f"\n\n[PERSONA - STYLE]: {persona.agent_style}"
        if persona.agent_behavior:
            prompt += f"\n\n[PERSONA - BEHAVIOR]: {persona.agent_behavior}"

        return {"preview": prompt[:5000] + "..." if len(prompt) > 5000 else prompt}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
