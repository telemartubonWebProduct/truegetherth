# Builds the 3D model of the router for the hero and everything the page needs with it:
#
#   blender --background --factory-startup --python scripts/blender/router.py -- [--preview shots/router.png] [--no-bake]
#
# (--no-bake builds the model and renders the preview only, to judge a change of shape; it writes no files for the page.)
#
#   public/models/router-v1.glb        the model (metres, Y up after export)
#   public/models/router-v1-ao.webp    ambient occlusion baked for the body, by Cycles
#   public/models/router-v1-floor.webp the soft shadow the router leaves on the floor
#
# The model follows the True "Smart Home Router" (Wi-Fi 7) in design/hero/router/
# reference-true-wifi7.webp: a low white slab on a clear stand, the top cut into
# two fields of diagonal fins that meet along a ridge, a row of status lights at
# the front edge, the logo at the front right, six paddle antennas splayed out.
# It is built from measurements chosen by eye from that photo, not from the
# manufacturer's drawings. The logo is the True Online mark the owner's site
# already uses (design/hero/router/trueonline.png).
#
# Everything is made in code so a change is one edit and one run. Light is not
# computed in the browser: the soft shading inside the fins and under the body
# is baked here and the page multiplies it in.

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "models")
LOGO = os.path.join(ROOT, "design", "hero", "router", "trueonline.png")
NAME = "router-v1"

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
PREVIEW = argv[argv.index("--preview") + 1] if "--preview" in argv else None
# Where the preview is taken from: --view x,y,z (the camera looks at the middle of the router).
VIEW = tuple(float(v) for v in argv[argv.index("--view") + 1].split(",")) if "--view" in argv else (-0.28, -1.0, 0.42)
BAKE = "--no-bake" not in argv

# Measurements, in metres. x: left to right, y: front (-) to back (+), z: up.
W, D, H = 0.262, 0.172, 0.040
BODY_Z = 0.016  # the body rests on the clear stand
TOP = BODY_Z + H
CORNER, RIM = 0.017, 0.0055
POCKET = 0.0046  # how deep the fins stand
FIN, PITCH = 0.0023, 0.0057
ANTENNA = 0.186

# The two fin fields on the top, seen from above (clockwise).
FIELD_A = [(-0.120, 0.075), (-0.006, 0.075), (0.104, -0.020), (0.020, -0.020), (0.020, -0.066), (-0.050, -0.066), (-0.120, -0.014)]
FIELD_B = [(0.008, 0.075), (0.120, 0.075), (0.120, -0.022)]
SEAM = Vector((0.110, -0.095)).normalized()

# Where each antenna is hinged, and which way it leans (degrees from upright: to the right, to the back).
ANTENNAS = [
    ((-0.134, -0.046), (-33, -7)),
    ((-0.134, 0.050), (-13, 6)),
    ((-0.072, 0.089), (-4, 11)),
    ((0.072, 0.089), (9, 9)),
    ((0.134, 0.050), (29, 5)),
    ((0.134, -0.046), (39, -6)),
]
# The status lights along the front edge, as on a fibre router.
LEDS = ["PWR", "PON", "LOS", "NET", "LAN1", "LAN2", "LAN3", "LAN4", "2.4G", "5G", "TEL", "USB"]
# The shell is two halves; this is where they meet, and the width of the line between them.
SPLIT, GAP = BODY_Z + 0.0150, 0.0007


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    return scene


def material(name, color, roughness=0.5, **inputs):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    for key, value in inputs.items():
        shader.inputs[key.replace("_", " ")].default_value = value
    return mat


def new_object(name, bm, materials=()):
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for mat in materials:
        mesh.materials.append(mat)
    return obj


def smooth(obj, angle=32):
    obj.data.shade_smooth()
    obj.data.set_sharp_from_angle(angle=math.radians(angle))


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def rounded_outline(w, d, radius, steps=8):
    """A rectangle with round corners, anticlockwise, centred on the origin."""
    points = []
    for cx, cy, start in ((w / 2 - radius, d / 2 - radius, 0), (-w / 2 + radius, d / 2 - radius, 90), (-w / 2 + radius, -d / 2 + radius, 180), (w / 2 - radius, -d / 2 + radius, 270)):
        for step in range(steps + 1):
            angle = math.radians(start + 90 * step / steps)
            points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def slab(bm, outline, z0, z1, rim, segments=3):
    """An outline pulled up into a solid, its edges rounded: `rim` is one radius for both, or (bottom, top)."""
    below, above = rim if isinstance(rim, tuple) else (rim, rim)
    verts = [bm.verts.new((x, y, z0)) for x, y in outline]
    base = bm.faces.new(verts)
    lifted = bmesh.ops.extrude_face_region(bm, geom=[base])
    top_verts = [item for item in lifted["geom"] if isinstance(item, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top_verts, vec=(0, 0, z1 - z0))
    bm.normal_update()
    for level, radius in ((z0, below), (z1, above)):
        if radius:
            edges = [edge for edge in bm.edges if all(abs(vert.co.z - level) < 1e-7 for vert in edge.verts)]
            bmesh.ops.bevel(bm, geom=edges, offset=radius, segments=segments if radius > 0.001 else 1, profile=0.5, affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def merge(bm, part, material_index=0):
    """Adds a part made in its own mesh. (Rounding edges reorders a mesh's points,
    so parts are finished separately and joined afterwards.)"""
    for face in part.faces:
        face.material_index = material_index
    scratch = bpy.data.meshes.new("Part")
    part.to_mesh(scratch)
    part.free()
    bm.from_mesh(scratch)
    bpy.data.meshes.remove(scratch)


def box(bm, size, matrix):
    made = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=made["verts"])
    bmesh.ops.transform(bm, matrix=matrix, verts=made["verts"])
    return made["verts"]


def clip(point, direction, polygon):
    """The stretches of a straight line that lie inside a polygon, as distances along it."""
    hits = []
    for index, a in enumerate(polygon):
        a = Vector(a)
        b = Vector(polygon[(index + 1) % len(polygon)])
        edge = b - a
        cross = direction.x * edge.y - direction.y * edge.x
        if abs(cross) < 1e-12:
            continue
        along = ((a.x - point.x) * edge.y - (a.y - point.y) * edge.x) / cross
        across = ((a.x - point.x) * direction.y - (a.y - point.y) * direction.x) / cross
        if 0 <= across < 1:
            hits.append(along)
    hits.sort()
    return [(hits[i], hits[i + 1]) for i in range(0, len(hits) - 1, 2)]


def fins(bm, polygon, direction):
    """Parallel fins filling a field, each as long as the field is wide where it stands."""
    normal = Vector((-direction.y, direction.x))
    reach = [Vector(p).dot(normal) for p in polygon]
    count = int((max(reach) - min(reach)) / PITCH)
    start = min(reach) + ((max(reach) - min(reach)) - count * PITCH) / 2 + PITCH / 2
    angle = math.atan2(direction.y, direction.x)
    for index in range(count):
        origin = normal * (start + index * PITCH)
        for near, far in clip(origin, direction, polygon):
            if far - near < 0.004:
                continue
            centre = origin + direction * ((near + far) / 2)
            # A little longer than the field, so each fin runs into the pocket's wall.
            matrix = Matrix.Translation((centre.x, centre.y, TOP - POCKET / 2 - 0.0001)) @ Matrix.Rotation(angle, 4, "Z")
            box(bm, (far - near + 0.001, FIN, POCKET - 0.0002), matrix)


def cut_pocket(body, polygon):
    """Sinks a field into the top of the body."""
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, TOP - POCKET)) for x, y in reversed(polygon)]
    face = bm.faces.new(verts)
    lifted = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, verts=[item for item in lifted["geom"] if isinstance(item, bmesh.types.BMVert)], vec=(0, 0, POCKET + 0.01))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    cutter = new_object("Cutter", bm)
    modifier = body.modifiers.new("Pocket", "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.solver = "EXACT"
    modifier.object = cutter
    activate(body)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def antenna_frame(hinge, lean):
    """The antenna's own axes: z along the blade, y through its thickness (towards the front)."""
    right, back = (math.radians(value) for value in lean)
    along = Vector((math.sin(right), math.sin(back), math.cos(right) * math.cos(back))).normalized()
    through = (Vector((0, -1, 0)) - along * along.dot(Vector((0, -1, 0)))).normalized()
    across = through.cross(along).normalized()
    frame = Matrix((across, through, along)).transposed().to_4x4()
    frame.translation = Vector((hinge[0], hinge[1], BODY_Z + 0.017))
    return frame, along


def antenna(bm, frame):
    """A flat paddle: a narrow neck that widens, a round tip; and the knuckle it turns on."""
    half, neck, thick = 0.0132, 0.0074, 0.0080
    outline = [(-neck, 0.004), (-neck, 0.014), (-half, 0.040)]
    outline += [(half * math.cos(math.radians(a)), ANTENNA - half + half * math.sin(math.radians(a))) for a in range(180, -1, -15)]
    outline += [(half, 0.040), (neck, 0.014), (neck, 0.004)]
    part = bmesh.new()
    face = part.faces.new([part.verts.new((x, -thick / 2, z)) for x, z in outline])
    lifted = bmesh.ops.extrude_face_region(part, geom=[face])
    bmesh.ops.translate(part, verts=[item for item in lifted["geom"] if isinstance(item, bmesh.types.BMVert)], vec=(0, thick, 0))
    rim = [edge for edge in part.edges if abs(edge.verts[0].co.y - edge.verts[1].co.y) < 1e-7]
    bmesh.ops.bevel(part, geom=rim, offset=0.0030, segments=3, profile=0.5, affect="EDGES", clamp_overlap=True)
    # The knuckle: a short cylinder across the blade's foot.
    knuckle = bmesh.ops.create_cone(part, cap_ends=True, segments=28, radius1=0.0094, radius2=0.0094, depth=0.022)
    bmesh.ops.rotate(part, verts=knuckle["verts"], cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "X"))
    ends = {edge for vert in knuckle["verts"] for edge in vert.link_edges if abs(edge.verts[0].co.y - edge.verts[1].co.y) < 1e-7}
    bmesh.ops.bevel(part, geom=list(ends), offset=0.0016, segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(part, faces=part.faces)
    bmesh.ops.transform(part, matrix=frame, verts=part.verts)
    merge(bm, part)


def build_body(white, vent):
    # The shell is two halves with a hairline between them. The upper half is made
    # first and alone, because the pockets are cut out of it: a cut needs one clean solid.
    bm = bmesh.new()
    slab(bm, rounded_outline(W, D, CORNER), SPLIT + GAP / 2, TOP, (0.0004, RIM))
    body = new_object("Body", bm, (white, vent))
    cut_pocket(body, FIELD_A)
    cut_pocket(body, FIELD_B)

    # The pockets' floors read as vents: a darker plastic. Their walls are shell.
    # (The cut leaves an empty material slot behind for the faces it made.)
    for polygon in body.data.polygons:
        floor = polygon.normal.z > 0.9 and abs(polygon.center.z - (TOP - POCKET)) < 1e-4
        polygon.material_index = 1 if floor else 0
    while len(body.data.materials) > 2:
        body.data.materials.pop(index=len(body.data.materials) - 1)

    bm = bmesh.new()
    bm.from_mesh(body.data)
    part = bmesh.new()
    slab(part, rounded_outline(W, D, CORNER), BODY_Z, SPLIT - GAP / 2, (RIM, 0.0004))
    merge(bm, part)
    # A darker core, which is what shows in the line between the halves.
    part = bmesh.new()
    slab(part, rounded_outline(W - 0.0026, D - 0.0026, CORNER - 0.0013), BODY_Z + 0.004, TOP - 0.008, 0)
    merge(bm, part, material_index=1)
    fins(bm, FIELD_A, SEAM)
    fins(bm, FIELD_B, Vector((-SEAM.y, SEAM.x)))
    tips = []
    for hinge, lean in ANTENNAS:
        frame, along = antenna_frame(hinge, lean)
        antenna(bm, frame)
        # The stub that carries the knuckle, from the body's side.
        inward = Vector((-hinge[0], -hinge[1], 0)).normalized()
        centre = Vector((hinge[0], hinge[1], BODY_Z + 0.017)) + inward * 0.006
        box(bm, (0.014, 0.012, 0.014), Matrix.Translation(centre) @ Matrix.Rotation(math.atan2(inward.y, inward.x), 4, "Z"))
        # Where a finger coming from the left meets this antenna: its left edge, a little under the tip.
        across = frame.col[0].xyz
        tips.append(frame.translation + along * (ANTENNA - 0.026) + across * 0.0128)
    bm.to_mesh(body.data)
    bm.free()
    smooth(body)
    return body, tips


def build_stand(clear):
    bm = bmesh.new()
    slab(bm, rounded_outline(0.232, 0.150, 0.014), 0.0, BODY_Z, 0.003)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, -0.016, 0))
    stand = new_object("Stand", bm, (clear,))
    smooth(stand)
    return stand


def led_x(index):
    return (index - (len(LEDS) - 1) / 2) * 0.0112


def build_leds():
    made = []
    for index in range(len(LEDS)):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.0014, radius2=0.0014, depth=0.0006)
        x = led_x(index)
        bmesh.ops.translate(bm, verts=bm.verts, vec=(x, -0.0772, TOP + 0.0001))
        lamp = material(f"Led{index:02d}", (0.05, 0.05, 0.05), 0.3, Emission_Color=(0.12, 1.0, 0.35, 1), Emission_Strength=2.0)
        made.append(new_object(f"Led{index:02d}", bm, (lamp,)))
    return made


def build_logo():
    image = bpy.data.images.load(LOGO)
    width = 0.070
    height = width * image.size[1] / image.size[0]
    bm = bmesh.new()
    corners = [(-width / 2, -height / 2), (width / 2, -height / 2), (width / 2, height / 2), (-width / 2, height / 2)]
    face = bm.faces.new([bm.verts.new((0.073 + x, -0.047 + y, TOP + 0.00025)) for x, y in corners])
    layer = bm.loops.layers.uv.new("UVMap")
    for loop, uv in zip(face.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop[layer].uv = uv
    mat = bpy.data.materials.new("Logo")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes["Principled BSDF"]
    shader.inputs["Roughness"].default_value = 0.45
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
    mat.surface_render_method = "BLENDED"
    return new_object("Logo", bm, (mat,))


def build_text(grey):
    """What is printed on the top: the product's name, and a label over each status light."""
    lines = [("Smart Home Router", 0.0054, (-0.1135, -0.0595), "LEFT")]
    lines += [(label, 0.0021, (led_x(index), -0.0738), "CENTER") for index, label in enumerate(LEDS)]
    made = []
    for body, size, (x, y), align in lines:
        curve = bpy.data.curves.new("Print", "FONT")
        curve.body, curve.size, curve.align_x = body, size, align
        text = bpy.data.objects.new("Print", curve)
        bpy.context.collection.objects.link(text)
        text.location = (x, y, TOP + 0.0002)
        activate(text)
        bpy.ops.object.convert(target="MESH")
        made.append(text)
    bpy.ops.object.select_all(action="DESELECT")
    for text in made:
        text.select_set(True)
    bpy.context.view_layer.objects.active = made[0]
    bpy.ops.object.join()
    made[0].data.materials.append(grey)
    return made[0]


def empty(name, location):
    marker = bpy.data.objects.new(name, None)
    marker.location = location
    bpy.context.collection.objects.link(marker)
    return marker


def bake(obj, name, size, floor):
    """Ambient occlusion for one object, as Cycles sees it with the rest of the model around."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = False
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.light_settings.distance = 0.09 if not floor else 0.16
    image = bpy.data.images.new(name, size, size, alpha=False)
    for mat in obj.data.materials:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        mat.node_tree.nodes.active = node
    activate(obj)
    bpy.ops.object.bake(type="AO", margin=6, use_clear=True)
    image.filepath_raw = os.path.join(OUT, f"{NAME}-{name}.webp")
    image.file_format = "WEBP"
    # Soft shading survives compression well, and the page downloads this.
    image.save(quality=78)
    print(f"baked {image.filepath_raw}")


def unwrap(obj):
    activate(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")


def preview(path, floor):
    """A look at the model as a photograph, to judge its shape: Cycles, a white studio."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.view_settings.view_transform = "AgX"
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.9, 0.9, 0.92, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
    floor.data.materials.clear()
    floor.data.materials.append(material("Studio", (0.9, 0.9, 0.92), 0.6))
    floor.scale = (6, 6, 1)
    for name, location, power, size in (("Key", (-0.5, -0.5, 0.9), 14, 0.9), ("Rim", (0.6, 0.5, 0.5), 6, 0.5)):
        light = bpy.data.lights.new(name, "AREA")
        light.energy, light.size = power, size
        lamp = bpy.data.objects.new(name, light)
        lamp.location = location
        lamp.rotation_euler = (Vector((0, 0, 0.03)) - Vector(location)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lamp)
    camera = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    camera.data.lens = 60
    camera.location = VIEW
    camera.rotation_euler = (Vector((0.0, 0.0, 0.065)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(camera)
    scene.camera = camera
    scene.render.filepath = os.path.abspath(path)
    bpy.ops.render.render(write_still=True)
    print(f"rendered {scene.render.filepath}")


def main():
    reset()
    os.makedirs(OUT, exist_ok=True)
    white = material("Shell", (0.86, 0.86, 0.87), 0.42, Coat_Weight=0.25, Coat_Roughness=0.2)
    vent = material("Vent", (0.42, 0.43, 0.45), 0.75)
    clear = material("Clear", (0.96, 0.98, 1.0), 0.04, Transmission_Weight=1.0, IOR=1.49)
    grey = material("Print", (0.42, 0.43, 0.46), 0.6)

    body, tips = build_body(white, vent)
    stand = build_stand(clear)
    leds = build_leds()
    logo = build_logo()
    caption = build_text(grey)
    # Where the robot's finger lands: on the antenna nearest to it.
    touch = empty("Touch", tips[0])

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            loop[layer].uv = (loop.vert.co.x + 0.5, loop.vert.co.y + 0.5)
    floor = new_object("Floor", bm, (material("Floor", (0.9, 0.9, 0.9), 0.9),))

    unwrap(body)
    if BAKE:
        stand.hide_render = True  # clear plastic casts no such shade
        for item in (logo, caption, *leds):
            item.hide_render = True
        bake(body, "ao", 2048, floor=False)
        bake(floor, "floor", 1024, floor=True)
        stand.hide_render = False
        for item in (logo, caption, *leds):
            item.hide_render = False
        # The bake's own image nodes are not part of the materials the page gets.
        for mat in list(body.data.materials) + list(floor.data.materials):
            for node in [n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image and n.image.name in ("ao", "floor")]:
                mat.node_tree.nodes.remove(node)

        # The model is written only together with its bake: the bake lies on this
        # run's unwrap, and another run does not lay the pieces out the same way.
        bpy.ops.object.select_all(action="DESELECT")
        for item in (body, stand, logo, caption, touch, floor, *leds):
            item.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=os.path.join(OUT, f"{NAME}.glb"),
            export_format="GLB",
            use_selection=True,
            export_apply=True,
            export_yup=True,
            export_cameras=False,
            export_lights=False,
        )
        triangles = sum(len(p.vertices) - 2 for p in body.data.polygons)
        print(f"exported {NAME}.glb; body {triangles} triangles; touch {tuple(round(v, 4) for v in touch.location)}")

    if PREVIEW:
        preview(PREVIEW, floor)


main()
